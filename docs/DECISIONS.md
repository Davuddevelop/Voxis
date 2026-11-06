# Decisions

One entry per decision that would be expensive to reverse or that someone will ask "why?" about.
Format: what we decided · why · what we rejected.

## 2026-11-06 · Scope = the spec's demo flow only (5-hour budget)
- **What:** Build C-01→C-08 (minus C-05), basic S-02, basic H-01, H-06, H-07, H-08. Seed the demo job instead of
  building the H-04 wizard; print a static QR instead of H-05.
- **Why:** The spec's P0 list is ~17 screens; 5 hours fits the section-5 demo flow, which is what judges see.
- **Rejected:** Building every P0 screen at low quality.

## 2026-11-06 · Landing page `/`: dark and mono-accented, modelled on a reference the owner picked
- **What:** `/` is near-black (#080A09) with Geist for headlines, Geist Mono for all other text, small pill markers,
  borderless raised cards and a grainy light-leak frame. Only the structure and look of the reference were used; no
  wording or images. It lives in its own route group, `src/app/(marketing)/`, with its own fonts.
- **Departs from the UI spec on purpose:** the spec's design system is light, Inter, no gradients. That still governs
  the product screens (C-xx, H-xx). The landing page is not a spec screen. The status colours keep their spec meaning
  but use lightened "on-dark" variants, because the spec's darker green and red fail WCAG AA contrast on near-black.
- **Why a route group:** Geist loads only for `/`, and `html:has(.landing-root)` paints the page dark (including iOS
  overscroll) without changing the root layout that every page shares.
- **Gotcha:** font tokens whose variables come from a nested layout must use `@theme inline`. A plain `@theme` token
  resolves `var(--font-x)` at the page root, where it does not exist, and silently falls back to the default font.
  The page looked fine but was in the wrong typeface; only a check of the loaded fonts showed it.
- **Kept on purpose:** no link to a screen that does not exist yet (in-page anchors only; add "HR girişi" in M6). The
  score specimen is labelled "Nümunə" and derived from the real scoring rules (5 of 8 points = 63). No privacy
  promises on this page: C-10 is unwritten and the free-tier data question is unresolved.
- **Rejected:** a hero photo or screenshot (none exist yet); the reference's rainbow light-leak (too loud for a
  minimal page, so the grain is white to black with a trace of teal).

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

## 2026-11-06 · Scoring rules (M1, decided by the owner)
- **Demo cashier job:** experience_months >= 6 (required), can_work_shifts (required), can_work_weekends (preferred),
  languages includes "ru" (preferred).
- **Weights 3:1** (required:preferred). Checked with 2 required + 2 preferred: at 2:1 a candidate who meets both
  required and a candidate who misses one required both score 67 (tie); at 3:1 they score 75 vs 63.
  - *Known limit:* "meets all required beats misses one required" holds only while a job has fewer than 3 preferred
    criteria (3 preferred: tie, 4+: the candidate missing a required one can win). Accepted for the demo job (2).
    If it matters later: sort candidates who meet all required first, or scale the ratio by criteria count.
- **Qismən** only for number_gte: ratio = value/threshold; >= 1 met; 0.5 <= ratio < 1 partial with credit
  weight * ratio; < 0.5 not met. Depends only on the two values.
  - *Known cliff:* 2 of 6 months earns 0 but 3 of 6 earns 1.5 points. Accepted: the label (red x vs yellow) matters
    more to HR than score smoothness.
- **Unknown (null) = 0 credit, status "unknown"**, shown as "Məlumat yoxdur", never as "Uyğun deyil". Fair only
  because the candidate confirms the profile on C-07 before scoring.
- **No criteria / threshold <= 0 => scoreProfile throws.** A silent 0 would rank everyone "low" because of a setup
  mistake. Zod (2-6 criteria, threshold > 0) rejects these at job creation, so HR gets a form error instead.
- **Criteria store `importance`, not a numeric weight** (my change, owner may veto): the 3:1 ratio is one constant in
  code, the UI has two segments, and old applications can be re-scored when the ratio changes.
- **`languages` is nullable** (my change): null = not mentioned (unknown), non-empty array = what they said. With
  plain `[]` we could not tell "speaks no Russian" from "did not say".
- **Rounding is half up** (Math.round): 62.5 -> 63, 87.5 -> 88.

### Follow-ups created by these decisions
- **M2:** the seed script must validate the demo job with the same `CriteriaSchema` as the HR form.
- **M2:** each criterion needs a question (spec H-04 warns otherwise). Demo job, 3 questions: Q1 experience,
  Q2 shifts + weekends, Q3 languages.
- **M4:** the extraction prompt must define `experience_months` exactly (months of cashier / sales / retail work
  the candidate states, not total career). This is the one place the LLM makes a judgement.
- **M5:** the scored fields must all be visible on C-07 (rule: the candidate confirms everything that is scored).
  The spec's C-07 has no shifts / weekends rows, so add them. And /confirm must save the application BEFORE scoring,
  so a throw never loses a candidate's answers.
