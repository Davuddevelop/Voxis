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

---
# Decisions from the end-to-end build (2026-11-06, owner asked Claude to build the whole system)

## HR rates every criterion 1-5; the priority IS the weight. No age criterion.
- **What:** criterion = { field, op, value, priority 1-5 }, weight = priority. Replaces Vacib/Arzuolunan (3:1).
- **Why:** one number HR already thinks in. **No age / gender / appearance / marital status:** spec H-04 forbids them and
  they are discrimination risks; the schema has no field for them, so scoring cannot use them even by accident.
- **Kept from M1:** partial credit only for number_gte (ratio >= 0.5, credit weight * ratio), unknown = 0 credit but shown
  as "Məlumat yoxdur", round half up, bands 75/50.

## Six facts, chosen from a fixed menu; questions are derived from the criteria
- **What:** experience_months, can_work_shifts, can_work_weekends, languages, has_driving_license, available_within_days
  (src/lib/catalog.ts). HR picks from this menu; each fact belongs to one of four question topics.
- **Why:** free-text criteria would make an LLM the judge (breaks hard rule 1). Deriving questions from criteria means a
  scored fact can never go unasked (spec H-04 warns about exactly that).
- **Cost:** HR cannot invent new kinds of criteria. Adding one = a catalog entry + a schema key + an extractor hint.

## Candidate flow is ONE page with a state machine, not one route per step
- **What:** /v/[kod] holds intro, consent, microphone, questions, processing, confirm, done in React state.
- **Why:** recorded answers live in memory, so back or reload cannot silently lose them; far less code than 7 routes.
- **Departure from the spec:** routes /raziliq, /mikrofon, /sual/[n], /emal, /tesdiq, /ugurlu are not separate URLs.
  Screen IDs and data-testid values (C-04-B5 ...) are kept.

## The browser converts every recording to 16 kHz mono WAV
- **Why:** Chrome records WebM/Opus, Safari MP4/AAC, Firefox Ogg; Gemini does not reliably accept all of them. WAV plays
  everywhere and is what the speech tests used. A 60 s answer is about 1.9 MB, under Vercel's 4.5 MB body limit.

## One Gemini client with model fallback; 429 and 503 are handled differently
- **Observed:** free-tier quota is per model (HTTP 429, clears in ~1 s); preview models get overloaded (503) and can take
  5-15 s just to say so; some calls hang. gemini-2.5-flash is closed to new keys.
- **What:** chain gemini-3.1-flash-lite -> 3.5-flash-lite -> 3.5-flash -> 3.8-flash. 429: one quick retry, then next model.
  503/timeout: next model immediately. 20 s per attempt, 50 s total. The error message lists every attempt.

## The extractor trusts nothing the model says it heard
- **Evidence guard:** a value survives only if its quote really occurs in the transcript (normalised); otherwise it becomes
  null and is reported as "dropped". If anything is dropped, a DIFFERENT model is asked once and the better result is kept.
  A dropped value is a safe failure: the candidate fills it in on the confirm screen.
- **Prompt context:** the vacancy title and the question asked go to the model, because speech recognition mis-hears
  "növbəli" (shift-based) as "növbəti" (next) and the question disambiguates it. Measured: with the context hint the
  transcript was correct; without it, wrong.

## A signed "extraction token" ties the confirmed profile to what the server produced
- **What:** /extract returns an HMAC token over {slug, transcripts, AI profile}. /confirm rebuilds that payload from what
  the browser sends back and verifies it (3 h limit). Evidence for the stored profile is taken from the server's copy.
- **Why:** without it a browser could send a forged "AI profile", hiding that the candidate edited a field, or fake
  transcripts. With it, "Namizəd düzəldib" is trustworthy. Candidates can still edit values; that is allowed and flagged.

## Database access goes through SECURITY DEFINER functions that demand a server secret (not a service key)
- **What:** tables have row security ON and NO policies, so the public key reads nothing (tested: 0 rows). The app calls
  app_* functions that check APP_DB_SECRET, which only our server knows.
- **Why:** Supabase does not hand the service-role key to this tooling; this gives the same protection without asking the
  owner to copy a key around. **Trade-offs:** Supabase's advisor will flag the functions as callable by anon (by design);
  if APP_DB_SECRET leaks, rotate it with one UPDATE on app_config and change the Vercel variable.

## Cache Components turned off
- Every page except the landing page reads live data or cookies, so it is dynamic anyway. With the feature on, each such
  page needs Suspense boundaries; the benefit was zero here.

## The consent screen tells the truth about Google
- The spec's text says only the company sees the data. Audio really is sent to Google Gemini to be transcribed, so the
  consent text says so. Free-tier keys may also let Google use inputs to improve its models: for production, use a paid
  tier whose terms exclude training. Say this in the pitch.

## HR login is hackathon-grade
- One demo account from env vars (HR_EMAIL, HR_PASSWORD), constant-time comparison, signed httpOnly cookie, 8 h, login
  rate limit. NOT production auth: no per-user accounts, lockout or password reset.

## Known limits
- Never tested with a real phone microphone or in a noisy shop; all end-to-end runs used synthetic speech through
  Chromium's fake microphone. Real accuracy will be lower than the 0.5% / 4-of-5 measured here.
- Rate limiter is per serverless instance (a speed bump, not a guarantee). Audio is not stored (HR sees transcripts).
- H-04 is one form, not a 4-step wizard. Reject reasons are not stored. Invite/reject messages are drafted, never sent.
