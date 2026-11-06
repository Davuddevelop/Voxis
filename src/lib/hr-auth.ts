import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { checkToken, makeToken } from "./signing";

// HR login for the hackathon: one demo account from env vars, and a signed cookie. This is NOT production auth
// (no per-user accounts, no lockout, no password reset). Say so honestly in the pitch.

const COOKIE = "voxis_hr";
const MAX_AGE_MS = 8 * 60 * 60 * 1000;
const PAYLOAD = { role: "hr" };

// Also used to sign the candidate's extraction token (domain-separated by the payload's "purpose").
export const signingSecret = () => {
  const value = process.env.HR_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("HR_SESSION_SECRET must be set (32+ characters)");
  return value;
};

// Hash both sides first so timingSafeEqual always compares equal-length buffers and a wrong guess takes
// the same time as a nearly right one.
const same = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export function credentialsAreValid(email: string, password: string): boolean {
  const expectedEmail = process.env.HR_EMAIL;
  const expectedPassword = process.env.HR_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false; // not configured = nobody gets in
  // Evaluate both (no short-circuit) so the response time does not reveal which one was wrong.
  const emailOk = same(email.trim().toLowerCase(), expectedEmail.toLowerCase());
  const passwordOk = same(password, expectedPassword);
  return emailOk && passwordOk;
}

export async function startHrSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, await makeToken(signingSecret(), PAYLOAD), {
    httpOnly: true, // JavaScript in the page can never read it
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_MS / 1000,
  });
}

export async function endHrSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isHr(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? checkToken(signingSecret(), PAYLOAD, token, MAX_AGE_MS) : false;
}
