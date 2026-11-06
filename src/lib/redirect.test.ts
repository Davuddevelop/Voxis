import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("accepts paths inside /hr", () => {
    for (const ok of ["/hr", "/hr/sehne", "/hr/vakansiyalar/abc?status=new", "/hr?x=1"]) expect(safeNext(ok)).toBe(ok);
  });

  it("falls back for anything that could leave the site or is not a plain path", () => {
    const attacks = ["https://evil.com", "//evil.com", "/hr//evil.com", "/hrx", "/\\evil.com", "/hr/\\evil", "javascript:alert(1)", "/v/demo", "", "/hr/a\nb", undefined, null, 42];
    for (const bad of attacks) expect(safeNext(bad)).toBe("/hr/vakansiyalar");
  });

  it("uses the fallback you give it", () => {
    expect(safeNext("https://evil.com", "/hr/sehne")).toBe("/hr/sehne");
  });
});
