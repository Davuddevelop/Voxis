// The only thing the rest of the app knows about speech-to-text. Swapping providers means writing one more file
// that implements this interface (see CLAUDE.md: STT is the riskiest dependency).

export type SttContext = {
  vacancyTitle?: string; // helps the model pick domain words ("növbəli", "kassir") over look-alikes ("növbəti")
};

export interface SttProvider {
  // Returns the transcript, or "" when there was no intelligible speech (the caller shows "Səsinizi eşitmədik").
  transcribe(audio: Buffer, mime: string, context?: SttContext): Promise<string>;
}

// What the model is told to output when it cannot hear anything. Spoken text is never allowed to equal this.
export const UNINTELLIGIBLE = "[anlaşılmadı]";
