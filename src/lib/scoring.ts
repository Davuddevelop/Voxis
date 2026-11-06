import type { Criterion, Profile } from "./schema";

// Four states, straight from spec section 8 (the four chips HR sees).
export type CriterionStatus = "met" | "partial" | "not_met" | "unknown";

export type CriterionResult = {
  criterionId: string;
  status: CriterionStatus;
  weight: number; // the most this criterion could earn (= HR's priority, 1-5)
  credit: number; // what it earned: weight if met, 0 if not_met or unknown, in between if partial
  evidence: string | null; // profile.evidence[field], or null when there is none
};

export type ScoreBand = "high" | "medium" | "low";

export type ScoreResult = {
  score: number; // integer 0-100
  band: ScoreBand;
  breakdown: CriterionResult[]; // same order as the criteria passed in
};

// Spec section 8: 75-100 high, 50-74 medium, 0-49 low.
export function bandFor(score: number): ScoreBand {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
}

// Below this share of the target, a number is "not met"; from here up to 1 it is "partial" (rules in
// docs/DECISIONS.md). Only number_gte can be partial.
const PARTIAL_FROM = 0.5;

function evaluate(profile: Profile, criterion: Criterion): CriterionResult {
  const weight = criterion.priority;
  const evidence = profile.evidence[criterion.field] ?? null;
  const result = (status: CriterionStatus, credit: number): CriterionResult => ({
    criterionId: criterion.id,
    status,
    weight,
    credit,
    evidence,
  });

  switch (criterion.op) {
    case "bool_true": {
      const value = profile[criterion.field];
      // Compare with null explicitly: false is an answer, null is the absence of one.
      if (value === null) return result("unknown", 0);
      return value ? result("met", weight) : result("not_met", 0);
    }
    case "number_gte": {
      // Dividing by zero would put NaN into every ranking, so refuse loudly (the schema already forbids it).
      if (criterion.value <= 0) throw new Error(`scoreProfile: threshold of "${criterion.id}" must be > 0`);
      const value = profile.experience_months;
      if (value === null) return result("unknown", 0);
      if (value >= criterion.value) return result("met", weight);
      // Multiply before dividing: weight * value / threshold keeps small whole numbers exact.
      if (value / criterion.value >= PARTIAL_FROM) return result("partial", (weight * value) / criterion.value);
      return result("not_met", 0);
    }
    case "number_lte": {
      const value = profile.available_within_days;
      if (value === null) return result("unknown", 0);
      return value <= criterion.value ? result("met", weight) : result("not_met", 0);
    }
    case "in_list": {
      const value = profile.languages;
      if (value === null) return result("unknown", 0);
      return value.some((code) => criterion.value.includes(code)) ? result("met", weight) : result("not_met", 0);
    }
  }
}

// Pure and deterministic: no network, no LLM, no clock. The same profile and criteria always give the same
// score, which is what lets HR trust and defend a ranking.
export function scoreProfile(profile: Profile, criteria: readonly Criterion[]): ScoreResult {
  if (criteria.length === 0) {
    throw new Error("scoreProfile: a job with no criteria cannot be scored (a silent 0 would rank everyone low)");
  }
  const breakdown = criteria.map((criterion) => evaluate(profile, criterion));
  const totalWeight = breakdown.reduce((sum, r) => sum + r.weight, 0);
  const earned = breakdown.reduce((sum, r) => sum + r.credit, 0);
  // Math.round rounds .5 up (62.5 -> 63), the rule the tests pin down.
  const score = Math.round((100 * earned) / totalWeight);
  return { score, band: bandFor(score), breakdown };
}
