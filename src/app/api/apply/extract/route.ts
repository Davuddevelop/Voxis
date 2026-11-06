import { NextResponse } from "next/server";
import { z } from "zod";
import { extractionPayload } from "@/lib/apply";
import { getJob } from "@/lib/db";
import { signingSecret } from "@/lib/hr-auth";
import { allow, clientIp, fail } from "@/lib/http";
import { extractProfile } from "@/lib/llm/extract";
import { makeToken } from "@/lib/signing";

// Transcripts in, the facts the AI understood out. The response carries a signed token so /confirm can later prove
// that the profile and transcripts it receives are the ones produced here.
export const maxDuration = 60;

const Body = z.object({
  slug: z.string().min(3).max(40),
  answers: z.array(z.object({ questionId: z.string().max(30), transcript: z.string().max(3000) })).min(1).max(4),
});

export async function POST(request: Request) {
  if (!allow(`extract:${clientIp(request)}`, 20, 10 * 60_000)) return fail(429, "rate_limited");
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, "bad_request");

  const job = await getJob(body.data.slug).catch(() => null);
  if (!job || job.status !== "active") return fail(404, "job_not_found");

  // The question text comes from the job, never from the browser, and an unknown question id is refused.
  const answers = [];
  for (const a of body.data.answers) {
    const question = job.questions.find((q) => q.id === a.questionId);
    if (!question) return fail(400, "unknown_question");
    answers.push({ questionId: a.questionId, question: question.text, transcript: a.transcript.trim() });
  }

  try {
    const { profile, dropped, model } = await extractProfile(job.title, answers);
    const plain = answers.map(({ questionId, transcript }) => ({ questionId, transcript }));
    const token = await makeToken(signingSecret(), extractionPayload(job.slug, plain, profile));
    console.log(`extract ok model=${model} dropped=${dropped.join(",") || "-"}`);
    return NextResponse.json({ profile, answers: plain, token });
  } catch (error) {
    console.error("extract failed:", error instanceof Error ? error.message : error);
    return fail(502, "extract_failed");
  }
}
