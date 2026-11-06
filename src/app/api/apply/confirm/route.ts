import { NextResponse } from "next/server";
import { z } from "zod";
import { consentIsPlausible, extractionPayload, finalizeProfile, normalizePhone } from "@/lib/apply";
import { createApplication, getJob } from "@/lib/db";
import { signingSecret } from "@/lib/hr-auth";
import { allow, clientIp, fail } from "@/lib/http";
import { CriteriaSchema, ProfileSchema } from "@/lib/schema";
import { scoreProfile } from "@/lib/scoring";
import { checkToken } from "@/lib/signing";

// The candidate has seen and confirmed the profile. Only now is anything scored or saved. The score is computed here,
// in plain code, from the confirmed facts; it is never sent back to the candidate (spec: "Namizəd balı və meyar
// nəticələrini heç vaxt görmür").
const Body = z.object({
  slug: z.string().min(3).max(40),
  consentAt: z.string().max(40),
  name: z.string().trim().min(2).max(80),
  phone: z.string().max(30),
  answers: z.array(z.object({ questionId: z.string().max(30), transcript: z.string().max(3000) })).min(1).max(4),
  extractedProfile: ProfileSchema,
  profile: ProfileSchema,
  token: z.string().max(200),
});

export async function POST(request: Request) {
  if (!allow(`confirm:${clientIp(request)}`, 10, 10 * 60_000)) return fail(429, "rate_limited");
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, "bad_request");
  const input = body.data;

  const phone = normalizePhone(input.phone);
  if (!phone) return fail(400, "bad_phone");
  if (!consentIsPlausible(input.consentAt)) return fail(400, "bad_consent");

  const job = await getJob(input.slug).catch(() => null);
  if (!job || job.status !== "active") return fail(404, "job_not_found");

  // Was the extracted profile really produced by us, from these transcripts, recently?
  const genuine = await checkToken(signingSecret(), extractionPayload(job.slug, input.answers, input.extractedProfile), input.token, 3 * 3_600_000);
  if (!genuine) return fail(400, "bad_token");

  const criteria = CriteriaSchema.safeParse(job.criteria);
  if (!criteria.success) return fail(500, "job_misconfigured");

  const { profile, edited } = finalizeProfile(input.extractedProfile, input.profile);
  const result = scoreProfile(profile, criteria.data);

  // Save before anything else can go wrong: the candidate's two minutes of effort must not be lost.
  try {
    await createApplication({
      job_id: job.id,
      candidate_name: input.name,
      phone,
      answers: input.answers.map((a) => ({ ...a, question: job.questions.find((q) => q.id === a.questionId)?.text ?? "" })),
      extracted_profile: input.extractedProfile,
      profile,
      edited_fields: edited,
      consent_at: new Date(input.consentAt).toISOString(),
      score: result.score,
      band: result.band,
      breakdown: result.breakdown,
    });
  } catch (error) {
    console.error("confirm failed:", error instanceof Error ? error.message : error);
    return fail(500, "save_failed");
  }
  return NextResponse.json({ ok: true });
}
