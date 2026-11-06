import { NextResponse } from "next/server";
import { DbError, listJobs } from "@/lib/db";

// A self-check for whoever deploys this: is every setting present, and does the database accept our secret?
// It reports yes/no only, never a value. Gemini is not called (it costs quota); the voice flow itself tests that.
const REQUIRED = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY", "APP_DB_SECRET", "HR_EMAIL", "HR_PASSWORD", "HR_SESSION_SECRET"] as const;

export async function GET() {
  const settings = Object.fromEntries(REQUIRED.map((name) => [name, Boolean(process.env[name])]));
  const sessionSecretLongEnough = (process.env.HR_SESSION_SECRET?.length ?? 0) >= 32;

  let database: "ok" | "missing_settings" | "secret_rejected" | "unreachable" = "ok";
  try {
    await listJobs();
  } catch (error) {
    if (error instanceof DbError && error.message.endsWith("is not set")) database = "missing_settings";
    else if (error instanceof DbError && (error.status === 401 || error.status === 403)) database = "secret_rejected";
    else database = "unreachable";
  }

  const ok = Object.values(settings).every(Boolean) && sessionSecretLongEnough && database === "ok";
  return NextResponse.json({ ok, settings, sessionSecretLongEnough, database }, { headers: { "cache-control": "no-store" } });
}
