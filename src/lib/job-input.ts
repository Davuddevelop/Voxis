import { randomInt } from "node:crypto";
import { z } from "zod";
import { questionsForCriteria, type JobQuestion } from "./catalog";
import { CriteriaSchema } from "./schema";

// What the HR form may send. Zod rejects anything else, so the database only ever sees valid jobs.
export const JobInputSchema = z
  .object({
    title: z.string().trim().min(2).max(60),
    company: z.string().trim().max(60).default(""),
    location: z.string().trim().max(80).default(""),
    description: z.string().trim().max(300).default(""),
    criteria: CriteriaSchema,
    // HR may reword a question; the topic (which facts it asks about) stays fixed by the criteria.
    questionTexts: z.record(z.string(), z.string().trim().min(5).max(200)).default({}),
  })
  .refine((job) => new Set(job.criteria.map((c) => c.id)).size === job.criteria.length, { message: "duplicate criterion ids" });

export type JobInput = z.infer<typeof JobInputSchema>;

export function buildQuestions(criteria: JobInput["criteria"], texts: JobInput["questionTexts"]): JobQuestion[] {
  return questionsForCriteria(criteria).map((q) => ({ ...q, text: texts[q.id] ?? q.text }));
}

// Short, unguessable, and easy to read out or type: no 0/o, 1/l/i.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function newSlug(length = 7): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
