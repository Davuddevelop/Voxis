import { z } from "zod";

// ISO 639-1 codes ("az", "ru", "en"). A pattern rather than a fixed enum so an unexpected language
// from the LLM doesn't reject the whole profile; the criterion decides which codes matter.
const LanguageCode = z.string().regex(/^[a-z]{2}$/);

// The facts the score may use. null means "the candidate did not say", which is a different fact from
// 0 / false / []. Display-only fields (name, district) join this schema in M4; they never reach scoring.
export const ProfileSchema = z.object({
  experience_months: z.number().int().min(0).nullable(),
  can_work_shifts: z.boolean().nullable(),
  can_work_weekends: z.boolean().nullable(),
  languages: z.array(LanguageCode).nullable(),
  // field name -> short transcript quote that HR sees next to the result.
  evidence: z.record(z.string(), z.string()),
});
export type Profile = z.infer<typeof ProfileSchema>;

// HR picks Vacib / Arzuolunan; the numeric weights live in scoring.ts, so changing the ratio is one line
// and old applications can be re-scored (spec H-04: "ballar yenidən hesablanacaq").
const criterionBase = {
  id: z.string().min(1),
  label: z.string().min(1), // HR's own words. Display only: never evaluated by code or by an LLM.
  importance: z.enum(["required", "preferred"]),
};

// Each operation is pinned to the fields it makes sense for, so "number_gte on languages" cannot even
// be constructed. scoring.ts therefore never has to handle a mismatched pair.
export const CriterionSchema = z.discriminatedUnion("op", [
  z.object({
    ...criterionBase,
    op: z.literal("bool_true"),
    field: z.enum(["can_work_shifts", "can_work_weekends"]),
  }),
  z.object({
    ...criterionBase,
    op: z.literal("number_gte"),
    field: z.literal("experience_months"),
    value: z.number().positive(), // > 0: scoring divides by it
  }),
  z.object({
    ...criterionBase,
    op: z.literal("in_list"),
    field: z.literal("languages"),
    value: z.array(LanguageCode).min(1), // met when ANY of the candidate's languages is in this list
  }),
]);
export type Criterion = z.infer<typeof CriterionSchema>;

// Spec H-04 step 2: a job has 2-6 criteria.
export const CriteriaSchema = z.array(CriterionSchema).min(2).max(6);
