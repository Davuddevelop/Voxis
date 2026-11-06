# How Voxis works (a guided tour)

Written so the owner can learn the code after it was built in one sitting. Read it with the files open.

## 1. The big picture

```
HR creates a job            Candidate scans the QR                         HR opens the list
(criteria + priority 1-5)   and answers by voice
        |                          |                                              ^
        v                          v                                              |
  /api/hr/jobs            browser records -> WAV (16 kHz mono)              /hr/vakansiyalar/[id]
  (Zod validates,                  |                                       ranked by score, with
   questions derived)              v                                       a per-criterion explanation
        |                  /api/apply/transcribe  --Gemini--> transcript            ^
        v                          |                                              |
   Supabase  <---------------------+---- /api/apply/extract --Gemini--> facts + quotes
   (jobs, applications)            |            (guard: quote must be in the transcript)
        ^                          v
        |                  candidate sees "Sizi belə başa düşdük", fixes anything
        |                          |
        +---------------  /api/apply/confirm:  verify signed token -> scoreProfile() (plain code) -> save
```

The one idea to hold on to: **AI turns speech into facts; ordinary code turns facts into a score.** Everything else
exists to make that safe (evidence quotes, candidate confirmation, signed token) or usable (UI).

## 2. File map

| Area | File | What it does |
|---|---|---|
| Facts | `src/lib/schema.ts` | The six facts, criteria and priorities, as Zod schemas. No field for age, gender, name... |
| Menu | `src/lib/catalog.ts` | What HR can pick, Azerbaijani labels, and which question covers which fact |
| **Score** | `src/lib/scoring.ts` | `scoreProfile()`: pure, deterministic. The heart of the product. Tests: `scoring.test.ts` |
| AI client | `src/lib/gemini.ts` | One place that calls Gemini: timeouts, 429 retry, fallback to the next model |
| Speech | `src/lib/stt/gemini.ts` | Audio in, transcript out (behind the `SttProvider` interface) |
| Extraction | `src/lib/llm/extract.ts` | Prompt, JSON schema, Zod check, **evidence guard**, second-model retry |
| Confirm rules | `src/lib/apply.ts` | Phone normalising, "which fields did the candidate edit", consent check |
| Integrity | `src/lib/signing.ts` | HMAC tokens (HR cookie and the extraction token) |
| Database | `src/lib/db.ts`, `supabase/migrations/0001_init.sql` | Only way to touch data; functions demand a server secret |
| HR login | `src/lib/hr-auth.ts` | Demo account, signed httpOnly cookie |
| Candidate UI | `src/components/apply/` | `ApplyFlow` (state machine), `useRecorder`, `audio.ts` (WAV), `ProfileForm` |
| HR UI | `src/components/hr/`, `src/app/hr/` | Login, job form, QR page, ranked table (`JobBoard`), side panel, decisions |
| Stage screen | `src/app/hr/sehne/page.tsx`, `src/app/hr/embed/[id]/page.tsx` | Candidate phone and live HR list on one screen (two iframes) |
| Landing | `src/app/(marketing)/`, `src/components/landing/` | The dark page at `/` |

## 3. Follow one answer through the system

1. **Record** (`useRecorder.ts`): `MediaRecorder` captures the microphone; an analyser draws the level bars; the timer
   stops at 60 s. On stop, `audio.ts` decodes the recording and re-encodes it as 16 kHz mono WAV.
2. **Transcribe** (`api/apply/transcribe`): checks the job is open, the file is a WAV under 4 MB, rate-limits by IP, then
   asks Gemini for a verbatim transcript, telling it the vacancy title so it prefers "növbəli" over "növbəti".
3. **Extract** (`api/apply/extract`): sends all transcripts plus the questions to Gemini with a strict JSON schema.
   `enforceEvidence` drops any value whose quote is not really in the transcript. The route signs the result (token).
4. **Confirm** (`ProfileForm`): the candidate sees each fact with "Siz dediniz: “...”" and can change it.
5. **Score** (`api/apply/confirm`): verifies the token, works out which fields were edited, runs `scoreProfile()` with the
   job's criteria, saves the application. The candidate gets only "ok".
6. **HR** (`components/hr/JobBoard.tsx`, shown by `vakansiyalar/[id]/page.tsx`): the database returns applications best-first; the panel shows each criterion's
   chip, the priority, and the quote (or "Namizəd düzəldib").

## 4. Where each hard rule lives

| Rule | Where |
|---|---|
| LLM never decides | `extract.ts` only returns facts; `scoring.ts` has no network or model call |
| No age/gender/name in the score | `schema.ts`: the fields do not exist; `scoring.ts` only reads the six facts |
| Candidate confirms first | `ApplyFlow` confirm step; `/confirm` is the only place that scores |
| Consent stored | consent checkbox sets a time; `consentIsPlausible` checks it; saved as `consent_at` |
| Never auto-reject | the only code that changes a status is `api/hr/applications/[id]/status`, called by a button |
| Evidence quotes | `enforceEvidence`; `finalizeProfile` drops the quote of an edited field |
| Candidate never sees the score | `/confirm` returns `{ ok: true }`; the page sends only the fields, never the criteria |

## 5. Running things

```bash
npm run lint && npm run typecheck && npm test      # 77 fast tests, no network
npm run dev                                         # needs .env.local (see .env.example)

# Live checks (real Gemini / real database), only when you want them:
set -a; . ./.env.local; set +a
LIVE=1 AUDIO_DIR=<folder with exp4.wav sched.wav lang.wav lic.wav> npx vitest run src/lib/llm
NODE_USE_ENV_PROXY=1 LIVE=1 npx vitest run src/lib/db      # in the cloud sandbox Node needs this flag to use the proxy
```

The full browser test (HR creates a job, a candidate speaks into a fake microphone, HR sees the result) was run with
Playwright during the build; it is not in the repo yet. Make that a first task if you want it as a regression test.

## 6. Test yourself (answer without looking)

1. A candidate says "həftəsonu işləyə bilmirəm". What is `can_work_weekends`, and what would it be if they never
   mentioned weekends? What does HR see in each case?
2. Why must the evidence quote be checked against the transcript, instead of trusting the model?
3. What stops a browser from sending a made-up AI profile to `/confirm`?
4. HR sets priorities 5 (shifts) and 1 (weekends). A candidate meets only weekends. Roughly what score? Where is that rule?
5. Why does `scoreProfile` throw on an empty criteria list instead of returning 0?
6. Why is audio converted to WAV in the browser rather than on the server?
7. The first Gemini model returns 503. What does `gemini.ts` do? What if it returns 429?
8. Which file would you change to add a new criterion type, such as "has own vehicle", and what else must change?
