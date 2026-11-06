import { generate } from "../gemini";
import { UNINTELLIGIBLE, type SttContext, type SttProvider } from "./types";

function buildPrompt(context?: SttContext): string {
  const vacancy = context?.vacancyTitle ? ` for the vacancy "${context.vacancyTitle}"` : "";
  return [
    "Transcribe this Azerbaijani speech exactly as spoken, word for word, in Azerbaijani Latin script (ə ğ ı ö ü ş ç).",
    "Do not translate, summarize, correct or add anything.",
    `Context: a job candidate answering an interview question${vacancy}.`,
    "Words that may appear: növbəli, həftəsonu, kassir, satıcı, kuryer, sürücülük vəsiqəsi, rus dili, ingilis dili, ay, il, həftə.",
    `If there is no speech, or it is too unclear to transcribe, output exactly ${UNINTELLIGIBLE}`,
    "Output only the transcript, nothing else.",
  ].join("\n");
}

// Models sometimes wrap the answer in quotes or a code fence even when told not to.
export function cleanTranscript(raw: string): string {
  const text = raw.replace(/^```[a-z]*\n?|\n?```$/g, "").trim().replace(/^["“]|["”]$/g, "").trim();
  return text === UNINTELLIGIBLE || text.length < 2 ? "" : text;
}

export const geminiStt: SttProvider = {
  async transcribe(audio, mime, context) {
    const { text } = await generate({
      contents: [{ parts: [{ text: buildPrompt(context) }, { inline_data: { mime_type: mime, data: audio.toString("base64") } }] }],
      generationConfig: { temperature: 0 },
    });
    return cleanTranscript(text);
  },
};
