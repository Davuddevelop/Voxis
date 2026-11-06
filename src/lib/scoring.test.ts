import { describe, expect, it } from "vitest";
import type { Criterion, Profile } from "./schema";
import { bandFor, scoreProfile } from "./scoring";
import type { CriterionStatus, ScoreBand } from "./scoring";

// The demo cashier job. Weights: exp 3 + shifts 3 + weekends 1 + ru 1 = 8.
const CASHIER_JOB: Criterion[] = [
  { id: "exp", label: "Ən azı 6 ay təcrübə", field: "experience_months", op: "number_gte", value: 6, importance: "required" },
  { id: "shifts", label: "Növbəli işləyə bilər", field: "can_work_shifts", op: "bool_true", importance: "required" },
  { id: "weekends", label: "Həftəsonu işləyə bilər", field: "can_work_weekends", op: "bool_true", importance: "preferred" },
  { id: "ru", label: "Rus dili", field: "languages", op: "in_list", value: ["ru"], importance: "preferred" },
];

// Meets every criterion. Each test overrides only the fields it is about.
const STRONG: Profile = {
  experience_months: 12,
  can_work_shifts: true,
  can_work_weekends: true,
  languages: ["az", "ru"],
  evidence: {},
};
const candidate = (overrides: Partial<Profile>): Profile => ({ ...STRONG, ...overrides });

type Row = {
  name: string;
  profile: Partial<Profile>;
  score: number;
  band: ScoreBand;
  statuses: [CriterionStatus, CriterionStatus, CriterionStatus, CriterionStatus]; // exp, shifts, weekends, ru
};

// score = round(100 * earned / 8), rounding .5 UP (62.5 -> 63, 87.5 -> 88).
const ROWS: Row[] = [
  { name: "all four met", profile: {}, score: 100, band: "high", statuses: ["met", "met", "met", "met"] },
  { name: "experience exactly at the threshold (6 >= 6)", profile: { experience_months: 6 }, score: 100, band: "high", statuses: ["met", "met", "met", "met"] },
  { name: "DEMO: 4 of 6 months is partial (credit 2)", profile: { experience_months: 4 }, score: 88, band: "high", statuses: ["partial", "met", "met", "met"] },
  { name: "5 of 6 months is partial (credit 2.5)", profile: { experience_months: 5 }, score: 94, band: "high", statuses: ["partial", "met", "met", "met"] },
  { name: "exactly half the threshold (3 of 6) is still partial", profile: { experience_months: 3 }, score: 81, band: "high", statuses: ["partial", "met", "met", "met"] },
  { name: "just under half (2 of 6) is not met", profile: { experience_months: 2 }, score: 63, band: "medium", statuses: ["not_met", "met", "met", "met"] },
  { name: "0 months said out loud is not_met, NOT unknown", profile: { experience_months: 0 }, score: 63, band: "medium", statuses: ["not_met", "met", "met", "met"] },
  { name: "experience not mentioned is unknown (same score as not_met)", profile: { experience_months: null }, score: 63, band: "medium", statuses: ["unknown", "met", "met", "met"] },
  { name: "cannot work shifts", profile: { can_work_shifts: false }, score: 63, band: "medium", statuses: ["met", "not_met", "met", "met"] },
  { name: "shifts not mentioned", profile: { can_work_shifts: null }, score: 63, band: "medium", statuses: ["met", "unknown", "met", "met"] },
  { name: "cannot work weekends (preferred only)", profile: { can_work_weekends: false }, score: 88, band: "high", statuses: ["met", "met", "not_met", "met"] },
  { name: "languages listed but no Russian", profile: { languages: ["az", "en"] }, score: 88, band: "high", statuses: ["met", "met", "met", "not_met"] },
  { name: "languages not mentioned is unknown, not not_met", profile: { languages: null }, score: 88, band: "high", statuses: ["met", "met", "met", "unknown"] },
  // Your 3:1 check. A meets both Vacib; B misses one Vacib; C meets no Vacib.
  { name: "A: both Vacib, no Arzuolunan (75 is exactly 'high')", profile: { can_work_weekends: false, languages: ["az"] }, score: 75, band: "high", statuses: ["met", "met", "not_met", "not_met"] },
  { name: "B: misses one Vacib, meets the rest", profile: { can_work_shifts: false }, score: 63, band: "medium", statuses: ["met", "not_met", "met", "met"] },
  { name: "C: no Vacib, both Arzuolunan", profile: { experience_months: 0, can_work_shifts: false }, score: 25, band: "low", statuses: ["not_met", "not_met", "met", "met"] },
  { name: "nothing mentioned at all (must not throw)", profile: { experience_months: null, can_work_shifts: null, can_work_weekends: null, languages: null }, score: 0, band: "low", statuses: ["unknown", "unknown", "unknown", "unknown"] },
];

describe("scoreProfile: score, band and status per criterion", () => {
  it.each(ROWS)("$name", ({ profile, score, band, statuses }) => {
    const result = scoreProfile(candidate(profile), CASHIER_JOB);
    expect(result.score).toBe(score);
    expect(result.band).toBe(band);
    expect(result.breakdown.map((r) => r.status)).toEqual(statuses);
  });
});

describe("scoreProfile: ranking", () => {
  it("meeting every Vacib beats missing one, which beats meeting none (demo job)", () => {
    const a = scoreProfile(candidate({ can_work_weekends: false, languages: ["az"] }), CASHIER_JOB).score;
    const b = scoreProfile(candidate({ can_work_shifts: false }), CASHIER_JOB).score;
    const c = scoreProfile(candidate({ experience_months: 0, can_work_shifts: false }), CASHIER_JOB).score;
    expect([a, b, c]).toEqual([75, 63, 25]);
  });
});

describe("scoreProfile: breakdown", () => {
  it("keeps the criteria order and reports weight and credit (partial earns weight * ratio)", () => {
    const { breakdown } = scoreProfile(candidate({ experience_months: 4 }), CASHIER_JOB);
    expect(breakdown.map((r) => r.criterionId)).toEqual(["exp", "shifts", "weekends", "ru"]);
    expect(breakdown.map((r) => r.weight)).toEqual([3, 3, 1, 1]);
    // toBeCloseTo: we pin the maths (3 * 4/6 = 2), not the exact floating-point bits.
    expect(breakdown[0]?.credit).toBeCloseTo(2, 10);
    expect(breakdown.slice(1).map((r) => r.credit)).toEqual([3, 1, 1]);
  });

  it("carries the evidence quote for the criterion's field, or null when there is none", () => {
    const quote = "Bir il marketdə kassir işləmişəm";
    const { breakdown } = scoreProfile(candidate({ evidence: { experience_months: quote } }), CASHIER_JOB);
    expect(breakdown.map((r) => r.evidence)).toEqual([quote, null, null, null]);
  });
});

describe("scoreProfile: refuses broken setups instead of guessing", () => {
  it("throws on an empty criteria list", () => {
    expect(() => scoreProfile(STRONG, [])).toThrow();
  });

  it("throws when a number_gte threshold is 0 (division by zero would leak NaN into rankings)", () => {
    const broken: Criterion[] = [
      { id: "exp", label: "x", field: "experience_months", op: "number_gte", value: 0, importance: "required" },
    ];
    expect(() => scoreProfile(STRONG, broken)).toThrow();
  });
});

describe("scoreProfile: purity", () => {
  it("does not mutate its inputs and returns the same result twice", () => {
    const deepFreeze = <T>(value: T): T => {
      if (typeof value === "object" && value !== null) {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
      }
      return value;
    };
    const profile = deepFreeze(candidate({ experience_months: 4, evidence: { experience_months: "4 ay" } }));
    const criteria = deepFreeze(structuredClone(CASHIER_JOB)); // writing to a frozen object throws
    const first = scoreProfile(profile, criteria);
    expect(first.score).toBe(88); // anchor to a real answer: "same twice" alone is true of any constant
    expect(scoreProfile(profile, criteria)).toEqual(first);
  });
});

describe("bandFor: boundaries from the spec (75-100 high, 50-74 medium, 0-49 low)", () => {
  it.each<[number, ScoreBand]>([
    [100, "high"],
    [75, "high"],
    [74, "medium"],
    [50, "medium"],
    [49, "low"],
    [0, "low"],
  ])("%i -> %s", (score, band) => {
    expect(bandFor(score)).toBe(band);
  });
});
