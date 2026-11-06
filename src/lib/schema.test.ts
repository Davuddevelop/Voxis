import { describe, expect, it } from "vitest";
import { CriteriaSchema, CriterionSchema, ProfileSchema } from "./schema";

const validProfile = {
  experience_months: 12,
  can_work_shifts: true,
  can_work_weekends: null,
  languages: ["az", "ru"],
  has_driving_license: null,
  available_within_days: 7,
  evidence: { experience_months: "bir il işləmişəm" },
};

const shifts = { id: "shifts", label: "Növbəli", field: "can_work_shifts", op: "bool_true", priority: 3 };
const exp = { id: "exp", label: "6 ay", field: "experience_months", op: "number_gte", value: 6, priority: 3 };

describe("ProfileSchema", () => {
  it("accepts a profile where some facts are unknown (null)", () => {
    expect(ProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects negative months", () => {
    expect(ProfileSchema.safeParse({ ...validProfile, experience_months: -1 }).success).toBe(false);
  });

  it("rejects an empty language list (it must be null when nothing was said)", () => {
    expect(ProfileSchema.safeParse({ ...validProfile, languages: [] }).success).toBe(false);
  });

  it("rejects a language that is not a 2-letter code (the LLM must output ISO codes)", () => {
    expect(ProfileSchema.safeParse({ ...validProfile, languages: ["russian"] }).success).toBe(false);
  });
});

describe("CriterionSchema", () => {
  it("accepts a matching operation and field", () => {
    expect(CriterionSchema.safeParse(exp).success).toBe(true);
  });

  it("rejects an operation on the wrong kind of field (number_gte on languages)", () => {
    expect(CriterionSchema.safeParse({ ...exp, field: "languages" }).success).toBe(false);
  });

  it("rejects a threshold of 0 or less", () => {
    expect(CriterionSchema.safeParse({ ...exp, value: 0 }).success).toBe(false);
  });
});

describe("priority", () => {
  it("must be a whole number from 1 to 5", () => {
    const ok = (priority: number) => CriterionSchema.safeParse({ ...exp, priority }).success;
    expect([ok(1), ok(5), ok(0), ok(6), ok(2.5)]).toEqual([true, true, false, false, false]);
  });
});

describe("CriteriaSchema", () => {
  it("requires 2 to 6 criteria (spec H-04)", () => {
    expect(CriteriaSchema.safeParse([exp]).success).toBe(false);
    expect(CriteriaSchema.safeParse([exp, shifts]).success).toBe(true);
    expect(CriteriaSchema.safeParse(Array(7).fill(exp)).success).toBe(false);
  });
});
