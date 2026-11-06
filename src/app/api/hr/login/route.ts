import { NextResponse } from "next/server";
import { z } from "zod";
import { credentialsAreValid, startHrSession } from "@/lib/hr-auth";
import { allow, clientIp, fail } from "@/lib/http";

const Body = z.object({ email: z.string().max(100), password: z.string().max(100) });

export async function POST(request: Request) {
  if (!allow(`login:${clientIp(request)}`, 10, 10 * 60_000)) return fail(429, "rate_limited");
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, "bad_request");
  if (!credentialsAreValid(body.data.email, body.data.password)) {
    await new Promise((resolve) => setTimeout(resolve, 400)); // slows down guessing
    return fail(401, "invalid_credentials");
  }
  await startHrSession();
  return NextResponse.json({ ok: true });
}
