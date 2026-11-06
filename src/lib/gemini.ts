// One thin Gemini client shared by speech-to-text and extraction. It exists for one reason: the free tier
// rate-limits per model (HTTP 429) and models get overloaded (503), and either would break a live demo.
// So: retry once on the same model, then fall back to the next model in the list.

// Fastest first. Quotas are per model, so a different model is a different bucket. (In testing, gemini-3.8-flash
// was often overloaded and took 5-15 s just to say 503, so it is a late fallback, not the first choice.)
export const MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiError extends Error {
  constructor(message: string, readonly attempts: string[]) {
    // The attempt log goes in the message: a bare "timed out" tells nobody what actually went wrong.
    super(attempts.length ? `${message} [${attempts.join("; ")}]` : message);
    this.name = "GeminiError";
  }
}

type GenerateOptions = {
  models?: string[];
  perAttemptMs?: number; // abort a single hung request
  totalMs?: number; // stop trying altogether (the serverless function has a hard limit)
};

type GeminiResponse = { candidates?: { content?: { parts?: { text?: string }[] } }[] };

export async function generate(body: object, options: GenerateOptions = {}): Promise<{ text: string; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set", []);
  const { models = MODELS, perAttemptMs = 20_000, totalMs = 50_000 } = options;
  const deadline = Date.now() + totalMs;
  const attempts: string[] = [];

  for (const model of models) {
    // A 429 (rate limit) often clears within a second, so one quick retry is worth it. A 503 (overloaded) does not,
    // and an overloaded model can take many seconds to answer, so go straight to the next model.
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (Date.now() >= deadline) throw new GeminiError("Gemini timed out", attempts);
      const startedAt = Date.now();
      const took = () => `${Date.now() - startedAt}ms`;
      let status = 0;
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": key, "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(Math.min(perAttemptMs, deadline - Date.now())),
        });
        status = response.status;
        if (response.ok) {
          const json = (await response.json()) as GeminiResponse;
          const text = (json.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
          if (text) return { text, model };
          attempts.push(`${model}: empty answer ${took()}`);
          break; // an empty answer will not improve on a retry of the same model
        }
        attempts.push(`${model}: HTTP ${status} ${took()}`);
      } catch (error) {
        attempts.push(`${model}: ${error instanceof Error ? error.name : "network error"} ${took()}`);
      }
      if (status === 429) await sleep(800);
      else break;
    }
  }
  throw new GeminiError("All Gemini models failed", attempts);
}
