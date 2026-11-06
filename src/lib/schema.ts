import { z } from "zod";

// ISO 639-1 codes ("az", "ru", "en"). A pattern rather than a fixed enum so an unexpected language
// from the LLM doesn't reject the whole profile; the criterion decides which codes matter.
const LanguageCode = z.string().regex(/^[a-z]{2}$/);

// Every fact the score may use, and nothing else. There is deliberately no age, gender, name, photo or
// ethnicity here: the type system itself keeps them out of scoring.
export const PROFILE_FIELDS = [
  "experience_months",
  "can_work_shifts",
  "can_work_weekends",
  "languages",
  "has_driving_license",
  "available_within_days",
] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

// null means "the candidate did not say", which is a different fact from 0 / false.
export const ProfileSchema = z.object({
  experience_months: z.number().int().min(0).max(720).nullable(),
  can_work_shifts: z.boolean().nullable(),
  can_work_weekends: z.boolean().nullable(),
  // Never an empty array: "no languages" and "did not say" must not look the same.
  languages: z.array(LanguageCode).min(1).nullable(),
  has_driving_license: z.boolean().nullable(),
  // 0 = can start immediately.
  available_within_days: z.number().int().min(0).max(365).nullable(),
  // field name -> short transcript quote that HR sees next to the result.
  evidence: z.record(z.string(), z.string()),
});
export type Profile = z.infer<typeof ProfileSchema>;

// HR rates each criterion 1 (nice to have) to 5 (critical). The priority IS the weight: one number HR
// already understands, and no second scale to explain.
export const PrioritySchema = z.number().int().min(1).max(5);

const criterionBase = {
  id: z.string().min(1),
  label: z.string().min(1).max(120), // HR's own words. Display only: never evaluated by code or by an LLM.
  priority: PrioritySchema,
};

// Each operation is pinned to the fields it makes sense for, so "number_gte on languages" cannot even
// be constructed. scoring.ts therefore never has to handle a mismatched pair.
export const CriterionSchema = z.discriminatedUnion("op", [
  z.object({
    ...criterionBase,
    op: z.literal("bool_true"),
    field: z.enum(["can_work_shifts", "can_work_weekends", "has_driving_license"]),
  }),
  z.object({
    ...criterionBase,
    op: z.literal("number_gte"),
    field: z.literal("experience_months"),
    value: z.number().positive(), // > 0: scoring divides by it
  }),
  z.object({
    ...criterionBase,
    op: z.literal("number_lte"),
    field: z.literal("available_within_days"),
    value: z.number().min(0), // "can start within N days"; 0 = immediately
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
