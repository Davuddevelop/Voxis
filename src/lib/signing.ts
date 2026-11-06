// Signed tokens, used in two places: the HR session cookie, and the "extraction token" that proves a profile was
// produced by our server and not made up by a browser. HMAC-SHA256 through Web Crypto (built into Node).

const encoder = new TextEncoder();

const toHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

const fromHex = (hex: string): Uint8Array<ArrayBuffer> | null => {
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

const importKey = (secret: string) =>
  crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

// JSON with sorted keys, so the same data always serialises to the same bytes no matter how it travelled
// (server -> browser -> server may reorder keys). Without this a valid signature could fail to verify.
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

// Token = "<issued-at ms>.<signature>". The signature covers the time AND the payload, so neither can be changed.
export async function makeToken(secret: string, payload: unknown, now = Date.now()): Promise<string> {
  const message = `${now}.${stableStringify(payload)}`;
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret), encoder.encode(message));
  return `${now}.${toHex(signature)}`;
}

export async function checkToken(secret: string, payload: unknown, token: string, maxAgeMs: number, now = Date.now()): Promise<boolean> {
  const [issuedAt, signatureHex, ...rest] = token.split(".");
  if (rest.length || !issuedAt || !signatureHex || !/^\d+$/.test(issuedAt)) return false;
  const age = now - Number(issuedAt);
  if (age < 0 || age > maxAgeMs) return false;
  const signature = fromHex(signatureHex);
  if (!signature) return false;
  // subtle.verify compares in constant time, so a wrong signature does not leak how much of it was right.
  return crypto.subtle.verify("HMAC", await importKey(secret), signature, encoder.encode(`${issuedAt}.${stableStringify(payload)}`));
}

// A permanent key derived from a secret: HMAC(secret, label) as hex. It powers the stage "demo login" link, so no new
// setting is needed, and changing the secret instantly revokes every such link.
export async function fixedKey(secret: string, label: string): Promise<string> {
  return toHex(await crypto.subtle.sign("HMAC", await importKey(secret), encoder.encode(`fixed-key:${label}`)));
}

export async function checkFixedKey(secret: string, label: string, candidate: string): Promise<boolean> {
  const signature = fromHex(candidate);
  if (!signature) return false;
  return crypto.subtle.verify("HMAC", await importKey(secret), signature, encoder.encode(`fixed-key:${label}`));
}
