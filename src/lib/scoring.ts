import type { Criterion, Profile } from "./schema";

// Four states, straight from spec section 8 (the four chips HR sees).
export type CriterionStatus = "met" | "partial" | "not_met" | "unknown";

export type CriterionResult = {
  criterionId: string;
  status: CriterionStatus;
  weight: number; // the most this criterion could earn
  credit: number; // what it earned: weight if met, 0 if not_met or unknown, in between if partial
  evidence: string | null; // profile.evidence[field], or null when there is none
};

export type ScoreBand = "high" | "medium" | "low";

export type ScoreResult = {
  score: number; // integer 0-100
  band: ScoreBand;
  breakdown: CriterionResult[]; // same order as the criteria passed in
};

// Vacib = 3, Arzuolunan = 1 (docs/DECISIONS.md).
export const WEIGHTS = { required: 3, preferred: 1 } as const;

// STUB for the owner to replace. Rules are in docs/DECISIONS.md; tests are in scoring.test.ts.
export function bandFor(score: number): ScoreBand {
  throw new Error(`TODO: bandFor(${score}) not implemented`);
}

export function scoreProfile(profile: Profile, criteria: readonly Criterion[]): ScoreResult {
  void profile;
  void criteria;
  // Deliberately wrong instead of throwing: a throwing stub would make the "throws on empty criteria"
  // tests pass for the wrong reason. A wrong answer keeps every test red until the real code exists.
  return { score: -1, band: "low", breakdown: [] };
}
