import { describe, expect, it } from "vitest";
import { consentIsPlausible, editedFields, finalizeProfile, normalizePhone } from "./apply";
import { buildQuestions, JobInputSchema, newSlug } from "./job-input";
import type { Profile } from "./schema";

const profile = (over: Partial<Profile> = {}): Profile => ({
  experience_months: 4,
  can_work_shifts: true,
  can_work_weekends: false,
  languages: ["az", "ru"],
  has_driving_license: null,
  available_within_days: 7,
  evidence: { experience_months: "dörd aydır", can_work_weekends: "işləyə bilmirəm" },
  ...over,
});

describe("normalizePhone", () => {
  it.each([
    ["050 123 45 67", "+994501234567"],
    ["0501234567", "+994501234567"],
    ["+994 50 123 45 67", "+994501234567"],
    ["994501234567", "+994501234567"],
    ["501234567", "+994501234567"],
  ])("%s -> %s", (input, expected) => expect(normalizePhone(input)).toBe(expected));

  it("returns null when it cannot be a phone number", () => {
    for (const bad of ["", "abc", "12345", "+994 50 123 45", "+994 50 123 45 678"]) expect(normalizePhone(bad)).toBeNull();
  });
});

describe("editedFields", () => {
  it("finds exactly the fields the candidate changed, ignoring language order", () => {
    const changed = profile({ experience_months: 12, languages: ["ru", "az"], can_work_weekends: true });
    expect(editedFields(profile(), changed)).toEqual(["experience_months", "can_work_weekends"]);
  });

  it("counts filling in an empty field as an edit", () => {
    expect(editedFields(profile(), profile({ has_driving_license: true }))).toEqual(["has_driving_license"]);
  });
});

describe("finalizeProfile", () => {
  it("keeps the quote for untouched fields and drops it for edited ones", () => {
    const { profile: final, edited } = finalizeProfile(profile(), profile({ experience_months: 12 }));
    expect(edited).toEqual(["experience_months"]);
    expect(final.evidence).toEqual({ can_work_weekends: "işləyə bilmirəm" });
  });

  it("takes evidence from the server's extraction, never from the browser's copy", () => {
    const forged = profile({ evidence: { experience_months: "FORGED", can_work_shifts: "FORGED" } });
    const { profile: final } = finalizeProfile(profile(), forged);
    expect(final.evidence).toEqual({ experience_months: "dörd aydır", can_work_weekends: "işləyə bilmirəm" });
  });
});

describe("consentIsPlausible", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  it("accepts a recent time and rejects the future, the distant past and garbage", () => {
    expect(consentIsPlausible("2026-11-06T11:55:00Z", now)).toBe(true);
    expect(consentIsPlausible("2026-11-06T12:30:00Z", now)).toBe(false);
    expect(consentIsPlausible("2026-11-06T05:00:00Z", now)).toBe(false);
    expect(consentIsPlausible("yesterday", now)).toBe(false);
  });
});

describe("job input", () => {
  const shifts = { id: "c1", label: "Növbəli", field: "can_work_shifts", op: "bool_true", priority: 5 };
  const exp = { id: "c2", label: "6 ay", field: "experience_months", op: "number_gte", value: 6, priority: 4 };

  it("derives one question per topic, in a fixed order, and lets HR reword it", () => {
    const input = JobInputSchema.parse({ title: "Kassir", criteria: [shifts, exp], questionTexts: { experience: "Neçə aydır kassirsiniz?" } });
    const questions = buildQuestions(input.criteria, input.questionTexts);
    expect(questions.map((q) => q.id)).toEqual(["experience", "schedule"]);
    expect(questions[0]?.text).toBe("Neçə aydır kassirsiniz?");
  });

  it("rejects duplicate criterion ids, a missing title, and a priority of 6", () => {
    expect(JobInputSchema.safeParse({ title: "Kassir", criteria: [shifts, { ...exp, id: "c1" }] }).success).toBe(false);
    expect(JobInputSchema.safeParse({ title: " ", criteria: [shifts, exp] }).success).toBe(false);
    expect(JobInputSchema.safeParse({ title: "Kassir", criteria: [shifts, { ...exp, priority: 6 }] }).success).toBe(false);
  });

  it("makes short slugs from an alphabet without look-alike characters", () => {
    const slug = newSlug();
    expect(slug).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{7}$/);
    expect(newSlug()).not.toBe(slug);
  });
});
