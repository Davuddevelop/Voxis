import { NextResponse } from "next/server";
import { getJob, resetDemo } from "@/lib/db";
import { isHr } from "@/lib/hr-auth";
import { fail } from "@/lib/http";

// Stage rehearsal clean-up. HR only, and the database function itself refuses any job but "demo".
export async function POST() {
  if (!(await isHr())) return fail(401, "unauthorized");
  const job = await getJob("demo").catch(() => null);
  if (!job) return fail(404, "no_demo_job");
  try {
    return NextResponse.json({ removed: await resetDemo(job.id) });
  } catch {
    return fail(500, "reset_failed");
  }
}
