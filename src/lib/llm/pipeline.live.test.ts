import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { geminiStt } from "../stt/gemini";
import { extractProfile } from "./extract";

// LIVE test: calls the real Gemini API with real audio, so it is excluded from `npm test`.
// Run:  set -a; . ./.env.local; set +a; LIVE=1 AUDIO_DIR=<folder with exp4.wav, sched.wav, lang.wav, lic.wav> npx vitest run src/lib/llm
// The audio is synthetic speech (clean), so this proves the pipeline and the prompts, not real-world accuracy.

const dir = process.env.AUDIO_DIR ?? "";
const QUESTIONS = [
  { id: "experience", question: "Bu işə bənzər işdə nə qədər işləmisiniz?", file: "exp4.wav" },
  { id: "schedule", question: "Növbəli işləyə bilərsinizmi? Həftəsonları necə?", file: "sched.wav" },
  { id: "languages", question: "Hansı dillərdə danışırsınız?", file: "lang.wav" },
  { id: "logistics", question: "Sürücülük vəsiqəniz varmı və nə vaxt işə başlaya bilərsiniz?", file: "lic.wav" },
];

describe.skipIf(!dir)("voice -> transcript -> facts (live Gemini)", () => {
  it("recovers the facts that were spoken, even through a mis-heard word", { timeout: 120_000 }, async () => {
    const answers = [];
    for (const q of QUESTIONS) {
      const transcript = await geminiStt.transcribe(fs.readFileSync(`${dir}/${q.file}`), "audio/wav", { vacancyTitle: "Kassir" });
      console.log(`${q.id}: ${transcript}`);
      answers.push({ questionId: q.id, question: q.question, transcript });
    }
    const { profile, dropped, model } = await extractProfile("Kassir", answers);
    console.log("model:", model, "| dropped:", dropped, "\n", JSON.stringify(profile, null, 1));

    // Spoken: 4 months as cashier; shifts yes, weekends no (has class); az + ru, NOT en; no licence; can start in a week.
    expect(profile.experience_months).toBe(4);
    expect(profile.can_work_shifts).toBe(true);
    expect(profile.can_work_weekends).toBe(false);
    expect(profile.languages?.sort()).toEqual(["az", "ru"]);
    expect(profile.has_driving_license).toBe(false);
    expect(profile.available_within_days).toBe(7);
  });
});
