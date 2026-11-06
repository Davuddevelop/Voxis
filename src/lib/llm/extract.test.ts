import { describe, expect, it } from "vitest";
import { cleanTranscript } from "../stt/gemini";
import { quoteAppearsIn } from "../text";
import { enforceEvidence, parseModelJson } from "./extract";

const blank = { experience_months: null, can_work_shifts: null, can_work_weekends: null, languages: null, has_driving_license: null, available_within_days: null };

describe("quoteAppearsIn", () => {
  it("ignores case, punctuation and spacing", () => {
    expect(quoteAppearsIn("dörd aydır marketdə", "Mən Dörd aydır, marketdə kassir işləyirəm.")).toBe(true);
  });

  it("treats the combining dot some tools leave behind as nothing", () => {
    expect(quoteAppearsIn("i̇ngilis dilini", "İngilis dilini bilmirəm")).toBe(true);
  });

  it("rejects a quote that is not in the text, and quotes too short to prove anything", () => {
    expect(quoteAppearsIn("üç il işləmişəm", "Mən dörd aydır işləyirəm")).toBe(false);
    expect(quoteAppearsIn("a", "a b c")).toBe(false);
  });
});

describe("enforceEvidence (the guard against invented facts)", () => {
  const transcripts = "Mən dörd aydır marketdə kassir işləyirəm. Həftəsonu işləyə bilmirəm.";

  it("keeps a value whose quote really occurs in the transcript", () => {
    const { profile, dropped } = enforceEvidence(
      { ...blank, experience_months: 4, can_work_weekends: false, evidence: { experience_months: "dörd aydır marketdə", can_work_weekends: "Həftəsonu işləyə bilmirəm" } },
      transcripts,
    );
    expect(profile.experience_months).toBe(4);
    expect(profile.can_work_weekends).toBe(false); // false is an answer, not an absence
    expect(dropped).toEqual([]);
  });

  it("turns a value into null when its quote is invented, and reports it", () => {
    const { profile, dropped } = enforceEvidence(
      { ...blank, has_driving_license: true, evidence: { has_driving_license: "sürücülük vəsiqəm var" } },
      transcripts,
    );
    expect(profile.has_driving_license).toBeNull();
    expect(profile.evidence).toEqual({});
    expect(dropped).toEqual(["has_driving_license"]);
  });

  it("drops a value that comes with no quote at all", () => {
    const { profile, dropped } = enforceEvidence({ ...blank, can_work_shifts: true, evidence: {} }, transcripts);
    expect(profile.can_work_shifts).toBeNull();
    expect(dropped).toEqual(["can_work_shifts"]);
  });

  it("never carries evidence for a null field", () => {
    const { profile } = enforceEvidence({ ...blank, evidence: { languages: "rus dili" } }, transcripts);
    expect(profile.evidence).toEqual({});
  });
});

describe("parseModelJson", () => {
  it("accepts fenced JSON, turns an empty language list into null, rounds 4.0 and drops null quotes", () => {
    const text = '```json\n{"experience_months":4.0,"can_work_shifts":null,"can_work_weekends":false,"languages":[],"has_driving_license":null,"available_within_days":7,"evidence":{"experience_months":"dörd ay","can_work_weekends":"yoxdur","languages":null}}\n```';
    const profile = parseModelJson(text);
    expect(profile.experience_months).toBe(4);
    expect(profile.languages).toBeNull();
    expect(profile.evidence).toEqual({ experience_months: "dörd ay", can_work_weekends: "yoxdur" });
  });

  it("lower-cases language codes and rejects values the schema forbids", () => {
    const base = { ...blank, evidence: {} };
    expect(parseModelJson(JSON.stringify({ ...base, languages: ["AZ", " Ru "] })).languages).toEqual(["az", "ru"]);
    expect(() => parseModelJson(JSON.stringify({ ...base, experience_months: -3 }))).toThrow();
  });
});

describe("cleanTranscript", () => {
  it("strips quotes and code fences, and maps the 'could not hear' marker and tiny output to empty", () => {
    expect(cleanTranscript('"Salam, mən işə müraciət edirəm."')).toBe("Salam, mən işə müraciət edirəm.");
    expect(cleanTranscript("[anlaşılmadı]")).toBe("");
    expect(cleanTranscript(" . ")).toBe("");
  });
});
