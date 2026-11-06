// Text helpers for comparing what the AI claims was said with what was really said.

// Lowercase the Azerbaijani way (I -> ı, İ -> i), drop the stray combining dot some tools leave behind,
// turn punctuation into spaces and squash whitespace. Used on both sides of every comparison.
export function normalizeForMatch(text: string): string {
  return text
    .replace(/̇/g, "")
    .normalize("NFC")
    .toLocaleLowerCase("az")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// True when `quote` really occurs in `source`. This is the guard against a model inventing evidence: a value
// whose supporting quote is not in the transcript is thrown away instead of trusted.
export function quoteAppearsIn(quote: string, source: string): boolean {
  const needle = normalizeForMatch(quote);
  if (needle.length < 2) return false;
  return normalizeForMatch(source).includes(needle);
}
