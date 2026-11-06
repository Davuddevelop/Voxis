# Decisions

One entry per decision that would be expensive to reverse or that someone will ask "why?" about.
Format: what we decided · why · what we rejected.

## 2026-11-06 · Scope = the spec's demo flow only (5-hour budget)
- **What:** Build C-01→C-08 (minus C-05), basic S-02, basic H-01, H-06, H-07, H-08. Seed the demo job instead of
  building the H-04 wizard; print a static QR instead of H-05.
- **Why:** The spec's P0 list is ~17 screens; 5 hours fits the section-5 demo flow, which is what judges see.
- **Rejected:** Building every P0 screen at low quality.

## 2026-11-06 · Landing page `/`: editorial style, one extra typeface
- **What:** `/` is a text-led editorial page: hairline rules, numbered sections, serif display headlines over Inter
  body text. Newsreader (serif) is used for headlines only; Inter stays the face of body text and of every product
  screen. Icons come from lucide-react (the spec asks for one icon set).
- **Why:** Spec section 9 wants calm and simple, with no gradients, shadow stacks or stock illustration. An editorial
  layout fits that, and the serif gives it character without any imagery. The spec has no marketing page, so this
  departs from "Inter" only here; swapping the face is one token (`--font-serif`).
- **Kept on purpose:** no link to a screen that does not exist yet (in-page anchors only; add "HR girişi" in M6).
  The score specimen is labelled "Nümunə" and derived from the real scoring rules (5 of 8 points = 63), not invented.
  No privacy promises on this page: C-10 is unwritten and the free-tier data question is unresolved.
- **Rejected:** hero illustration or screenshots (spec forbids stock art; there is no real UI to show yet).

## 2026-11-06 · Routes follow the UI spec
- **What:** Candidate `/v/[kod]/...`, HR `/hr/vakansiyalar/...` (spec section 4).
- **Why:** Spec says only screen IDs are binding, but sharing route names with design keeps one vocabulary.
  `/v/[kod]` is also short: a shorter URL makes a less dense QR code, which scans better from a printed poster.
- **Rejected:** English routes from the build kit (`/j/[slug]`, `/hr/jobs`).

## 2026-11-06 · Criteria are tied to profile fields, never free text judged by an LLM
- **What:** A criterion = `{ field, op, value, importance }`. HR's sentence ("Ən azı 6 ay kassir...") is only a label.
- **Why:** Matching free text against free text needs an LLM to judge, which makes the LLM the scorer
  (breaks hard rule #1) and gives different results on reruns.
- **Rejected:** Free-text criteria evaluated by the LLM (spec H-04 as written).
- **Follow-up (M1):** experience in months (spec example "6 ay"); past roles as a fixed list; define "Qismən".

## 2026-11-06 · STT/LLM provider: start with a free key, keep it behind an interface
- **What:** No API keys at start. Try Gemini (free tier, no card) first, ElevenLabs Scribe as comparison.
  Decide in M3 on 5 real samples, measuring extracted-field accuracy, not word error rate.
- **Why:** Vendor benchmark on Azerbaijani FLEURS: Gemini Flash ~8.8% WER, Scribe ~9.4%, Whisper large-v3 ~29.7%.
- **Trade-off:** Free tiers may use inputs to improve the provider's models. This contradicts the C-02 promise
  "only [company] sees your data". Acceptable for a demo with informed teammates; production needs a paid,
  no-training tier. Say this in the pitch.
- **Rejected:** Groq free Whisper (weakest on Azerbaijani).

## 2026-11-06 · Node 22 everywhere
- **What:** `@types/node@^22`, `"engines": { "node": "22.x" }`.
- **Why:** Local runtime is Node 22; the template pinned Node 20 types, which Vitest 5 rejects. Types must
  describe the runtime we actually run. `engines` makes Vercel use the same major version.
- **Rejected:** `npm install --legacy-peer-deps` (hides the mismatch instead of fixing it).

## 2026-11-06 · Next.js 16 with Cache Components (template default)
- **What:** Keep `cacheComponents: true`.
- **Why / consequences:** Data fetching is dynamic by default (good: HR list must be fresh). Routes stay mounted
  but hidden after navigation (React `<Activity>`); effects are cleaned up. The M5 recorder must release the
  microphone in its effect cleanup, or the mic stays on after leaving C-04.

## 2026-11-06 · Git: one branch per milestone, squash into main
- **What:** Work on `mN-name`, WIP commits allowed there; at milestone end the owner approves one conventional
  commit message and we squash-merge to `main`.
- **Why:** The cloud container is ephemeral, so work must be pushed often; `main` still only gets approved commits.
