import { NextResponse } from "next/server";

export const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

// Behind Vercel the client address is in x-forwarded-for (first entry).
export const clientIp = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

// A small in-memory limiter. On serverless every instance has its own counters, so this is a speed bump against a
// script hammering the speech endpoint (which spends our Gemini quota), not a hard guarantee.
const hits = new Map<string, number[]>();
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  hits.set(key, [...recent, now]);
  if (hits.size > 5000) hits.clear(); // never grow without bound
  return true;
}
