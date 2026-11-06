import { describe, expect, it } from "vitest";
import { defaultCriterionLabel } from "./catalog";
import { initials, timeAgo } from "./format";

describe("initials", () => {
  it("takes the first letter of the first two words, upper-cased the Azerbaijani way", () => {
    expect(initials("Aysel Məmmədova")).toBe("AM");
    expect(initials("  ilkin  ")).toBe("İ"); // i -> İ, not I
    expect(initials("Əli Vəliyev Oğlu")).toBe("ƏV");
    expect(initials("")).toBe("?");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  it.each([
    ["2026-11-06T11:59:40Z", "indicə"],
    ["2026-11-06T11:55:00Z", "5 dəq əvvəl"],
    ["2026-11-06T10:00:00Z", "2 saat əvvəl"],
    ["2026-11-03T12:00:00Z", "3 gün əvvəl"],
  ])("%s -> %s", (iso, expected) => expect(timeAgo(iso, now)).toBe(expected));
});

describe("defaultCriterionLabel", () => {
  it("words each kind of criterion", () => {
    expect(defaultCriterionLabel("experience_months", 6)).toBe("Ən azı 6 ay təcrübə");
    expect(defaultCriterionLabel("languages", ["ru", "en"])).toBe("Dil: Rus, İngilis");
    expect(defaultCriterionLabel("available_within_days", 0)).toBe("Dərhal işə başlaya bilər");
    expect(defaultCriterionLabel("available_within_days", 14)).toBe("14 gün ərzində işə başlaya bilər");
    expect(defaultCriterionLabel("can_work_shifts")).toBe("Növbəli işləyə bilər");
  });
});
