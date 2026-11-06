import { PROFILE_FIELDS, type Profile, type ProfileField } from "./schema";

// Rules for the moment a candidate confirms what the AI understood. Pure functions, so they are unit-tested.

// "050 123 45 67", "0501234567", "+994 50 123 45 67" -> "+994501234567". null when it cannot be a phone number.
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const national = digits.startsWith("994") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits;
  return /^\d{9}$/.test(national) ? `+994${national}` : null;
}

// Order must not matter for languages: ["ru","az"] and ["az","ru"] are the same answer.
const canonical = (value: unknown) => JSON.stringify(Array.isArray(value) ? [...value].sort() : value);

export function editedFields(extracted: Profile, confirmed: Profile): ProfileField[] {
  return PROFILE_FIELDS.filter((field) => canonical(extracted[field]) !== canonical(confirmed[field]));
}

// What gets stored and scored. Two deliberate choices:
//  - Evidence comes from the server's own extraction, never from what the browser sent back, so it cannot be forged.
//  - A field the candidate changed loses its quote (it no longer supports the new value); HR sees "Namizəd düzəldib".
export function finalizeProfile(extracted: Profile, confirmed: Profile): { profile: Profile; edited: ProfileField[] } {
  const edited = editedFields(extracted, confirmed);
  const evidence: Record<string, string> = {};
  for (const field of PROFILE_FIELDS) {
    const quote = extracted.evidence[field];
    if (quote && !edited.includes(field) && confirmed[field] !== null) evidence[field] = quote;
  }
  return { profile: { ...confirmed, evidence }, edited };
}

// The consent time comes from the browser, so it only needs to be believable: not in the future, not stale.
export function consentIsPlausible(consentAt: string, now = Date.now()): boolean {
  const time = Date.parse(consentAt);
  return Number.isFinite(time) && time <= now + 5 * 60_000 && now - time <= 6 * 3_600_000;
}

// What the extraction token vouches for. /extract signs it, /confirm re-builds it from what the browser sends back
// and checks the signature: if the transcripts or the AI's profile were altered on the way, it no longer matches.
export type PlainAnswer = { questionId: string; transcript: string };
export const extractionPayload = (slug: string, answers: PlainAnswer[], profile: Profile) => ({ purpose: "extract", slug, answers, profile });
