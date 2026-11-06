import { NextResponse } from "next/server";
import { getJob } from "@/lib/db";
import { signingSecret, startHrSession } from "@/lib/hr-auth";
import { allow, clientIp, fail } from "@/lib/http";
import { checkFixedKey } from "@/lib/signing";

// One-tap HR sign-in for the stage: /hr/demo?k=<key>. It exists so nobody types a password in front of the jury, while
// the HR panel (which shows candidates' phone numbers) stays closed to everyone who does not hold the key. The key is
// derived from HR_SESSION_SECRET, so changing that secret revokes the link. Anything wrong answers 404, not "wrong key".
export async function GET(request: Request) {
  if (!allow(`demo:${clientIp(request)}`, 10, 10 * 60_000)) return fail(429, "rate_limited");
  const url = new URL(request.url);
  if (!(await checkFixedKey(signingSecret(), "demo-login", url.searchParams.get("k") ?? ""))) return fail(404, "not_found");

  await startHrSession();
  const job = await getJob("demo").catch(() => null);
  return NextResponse.redirect(new URL(job ? `/hr/vakansiyalar/${job.id}` : "/hr/vakansiyalar", url));
}
