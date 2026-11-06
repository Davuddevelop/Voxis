import { describe, expect, it } from "vitest";
import { checkToken, makeToken, stableStringify } from "./signing";

const SECRET = "test-secret-with-enough-length-0123456789";
const HOUR = 3_600_000;

describe("stableStringify", () => {
  it("gives the same text whatever order the keys arrive in, including nested ones", () => {
    expect(stableStringify({ b: 1, a: { d: [2, { z: 1, y: 2 }], c: null } })).toBe(stableStringify({ a: { c: null, d: [2, { y: 2, z: 1 }] }, b: 1 }));
  });
});

describe("signed tokens", () => {
  const payload = { purpose: "extract", slug: "k7m2xq", profile: { experience_months: 4, languages: ["az", "ru"] } };

  it("accepts the same payload even when its keys were re-ordered on the way", async () => {
    const token = await makeToken(SECRET, payload);
    const reordered = { profile: { languages: ["az", "ru"], experience_months: 4 }, slug: "k7m2xq", purpose: "extract" };
    expect(await checkToken(SECRET, reordered, token, HOUR)).toBe(true);
  });

  it("rejects a payload that was changed after signing (an edited profile)", async () => {
    const token = await makeToken(SECRET, payload);
    expect(await checkToken(SECRET, { ...payload, profile: { experience_months: 40, languages: ["az", "ru"] } }, token, HOUR)).toBe(false);
  });

  it("rejects a token made with another secret, a tampered signature, and garbage", async () => {
    const token = await makeToken(SECRET, payload);
    expect(await checkToken("another-secret-another-secret-0000", payload, token, HOUR)).toBe(false);
    expect(await checkToken(SECRET, payload, token.slice(0, -2) + "00", HOUR)).toBe(false);
    for (const junk of ["", "x", "1.zz", "1.2.3", "abc.def"]) expect(await checkToken(SECRET, payload, junk, HOUR)).toBe(false);
  });

  it("rejects an expired token and one dated in the future", async () => {
    const now = 1_700_000_000_000;
    const token = await makeToken(SECRET, payload, now);
    expect(await checkToken(SECRET, payload, token, HOUR, now + HOUR - 1)).toBe(true);
    expect(await checkToken(SECRET, payload, token, HOUR, now + HOUR + 1)).toBe(false);
    expect(await checkToken(SECRET, payload, token, HOUR, now - 1)).toBe(false);
  });
});

describe("fixed keys (the stage demo link)", () => {
  it("are repeatable, verify, and break when the secret, the label or a single character changes", async () => {
    const { fixedKey, checkFixedKey } = await import("./signing");
    const key = await fixedKey(SECRET, "demo-login");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(await fixedKey(SECRET, "demo-login")).toBe(key);
    expect(await checkFixedKey(SECRET, "demo-login", key)).toBe(true);
    expect(await checkFixedKey("another-secret-another-secret-0000", "demo-login", key)).toBe(false);
    expect(await checkFixedKey(SECRET, "something-else", key)).toBe(false);
    expect(await checkFixedKey(SECRET, "demo-login", key.slice(0, -1) + (key.endsWith("0") ? "1" : "0"))).toBe(false);
    for (const junk of ["", "zz", "abc", "0".repeat(63)]) expect(await checkFixedKey(SECRET, "demo-login", junk)).toBe(false);
  });
});
