import type { Criterion, ProfileField } from "./schema";

// What HR can build criteria from. Each entry ties a profile field to (a) the words HR sees, (b) the kind of
// input the form shows, and (c) the question that makes a candidate talk about it. Adding a field means a new
// entry here, a new key in schema.ts, and a hint for the extractor. Nothing else in the app is field-specific.

export type FieldKind = "months" | "yesno" | "languages" | "days";

export const FIELD_CATALOG: Record<
  ProfileField,
  { label: string; kind: FieldKind; op: Criterion["op"]; question: QuestionKey; defaultLabel: string }
> = {
  experience_months: { label: "İş təcrübəsi", kind: "months", op: "number_gte", question: "experience", defaultLabel: "İş təcrübəsi" },
  can_work_shifts: { label: "Növbəli iş", kind: "yesno", op: "bool_true", question: "schedule", defaultLabel: "Növbəli işləyə bilər" },
  can_work_weekends: { label: "Həftəsonu iş", kind: "yesno", op: "bool_true", question: "schedule", defaultLabel: "Həftəsonu işləyə bilər" },
  languages: { label: "Dil bilikləri", kind: "languages", op: "in_list", question: "languages", defaultLabel: "Dil bilikləri" },
  has_driving_license: { label: "Sürücülük vəsiqəsi", kind: "yesno", op: "bool_true", question: "logistics", defaultLabel: "Sürücülük vəsiqəsi var" },
  available_within_days: { label: "İşə başlama müddəti", kind: "days", op: "number_lte", question: "logistics", defaultLabel: "Tez işə başlaya bilər" },
};

export const LANGUAGE_OPTIONS = [
  { code: "az", label: "Azərbaycan" },
  { code: "ru", label: "Rus" },
  { code: "en", label: "İngilis" },
  { code: "tr", label: "Türk" },
] as const;

export type QuestionKey = "experience" | "schedule" | "languages" | "logistics";

// One question can cover several facts, so a job needs at most four questions (spec: 2-4, but one is fine
// when every criterion belongs to the same topic). Order = the order candidates are asked.
export const QUESTION_TEMPLATES: Record<QuestionKey, { text: string; hint: string }> = {
  experience: {
    text: "Bu işə bənzər işdə nə qədər işləmisiniz?",
    hint: "Harada və nə qədər müddət işlədiyinizi deyin.",
  },
  schedule: {
    text: "Növbəli işləyə bilərsinizmi? Həftəsonları necə?",
    hint: "Növbəli işə və həftəsonuna münasibətinizi deyin.",
  },
  languages: {
    text: "Hansı dillərdə danışırsınız?",
    hint: "Bildiyiniz dilləri sadalayın.",
  },
  logistics: {
    text: "Sürücülük vəsiqəniz varmı və nə vaxt işə başlaya bilərsiniz?",
    hint: "Vəsiqənin olub-olmadığını və başlama vaxtını deyin.",
  },
};

const QUESTION_ORDER: QuestionKey[] = ["experience", "schedule", "languages", "logistics"];

export type JobQuestion = { id: QuestionKey; text: string; hint: string; fields: ProfileField[] };

// Every criterion must be covered by a question (spec H-04 warns when one is not), so the questions are
// derived from the criteria instead of being picked separately: no way to forget one.
export function questionsForCriteria(criteria: readonly Criterion[]): JobQuestion[] {
  const fieldsByQuestion = new Map<QuestionKey, Set<ProfileField>>();
  for (const criterion of criteria) {
    const key = FIELD_CATALOG[criterion.field].question;
    fieldsByQuestion.set(key, (fieldsByQuestion.get(key) ?? new Set()).add(criterion.field));
  }
  return QUESTION_ORDER.filter((key) => fieldsByQuestion.has(key)).map((key) => ({
    id: key,
    text: QUESTION_TEMPLATES[key].text,
    hint: QUESTION_TEMPLATES[key].hint,
    fields: [...(fieldsByQuestion.get(key) ?? [])],
  }));
}
