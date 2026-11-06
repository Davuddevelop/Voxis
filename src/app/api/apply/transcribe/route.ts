import { NextResponse } from "next/server";
import { getJob } from "@/lib/db";
import { fail, allow, clientIp } from "@/lib/http";
import { geminiStt } from "@/lib/stt/gemini";

// Speech in, text out. Public (candidates are not logged in), so it checks the job exists and is open, caps the size,
// and rate-limits: every call spends our Gemini quota.
export const maxDuration = 60;
const MAX_BYTES = 4_000_000; // Vercel rejects request bodies above 4.5 MB anyway; 60 s of 16 kHz mono WAV is ~1.9 MB

export async function POST(request: Request) {
  if (!allow(`stt:${clientIp(request)}`, 40, 10 * 60_000)) return fail(429, "rate_limited");

  const form = await request.formData().catch(() => null);
  const slug = form?.get("slug");
  const audio = form?.get("audio");
  if (typeof slug !== "string" || !(audio instanceof Blob)) return fail(400, "bad_request");
  if (audio.size < 2_000 || audio.size > MAX_BYTES) return fail(400, "audio_size");

  const bytes = Buffer.from(await audio.arrayBuffer());
  if (bytes.subarray(0, 4).toString("latin1") !== "RIFF") return fail(400, "audio_format"); // the browser sends WAV

  const job = await getJob(slug).catch(() => null);
  if (!job || job.status !== "active") return fail(404, "job_not_found");

  try {
    const transcript = await geminiStt.transcribe(bytes, "audio/wav", { vacancyTitle: job.title });
    return NextResponse.json({ transcript }); // "" means no intelligible speech: the screen asks to record again
  } catch (error) {
    console.error("transcribe failed:", error instanceof Error ? error.message : error);
    return fail(502, "stt_failed");
  }
}
