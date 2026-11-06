# Project: Voxis

## One-line product
A voice-based job application platform for high-volume jobs (cashier, sales, courier, warehouse) in Azerbaijan.
A candidate scans a QR code, answers 2-4 questions by voice in Azerbaijani (no CV), and the system turns it into
a structured profile plus an explainable match score. HR sees a ranked list. A human always makes the final decision.

## HOW YOU MUST WORK WITH ME (most important section)
I am a learning engineer, not a client. I want to understand every line that goes into this repo.
You are my senior engineer/mentor. Therefore:

1. NO VIBE CODING. Never build a whole feature in one shot.
2. For every milestone, follow this loop:
   a. EXPLAIN: 5-8 lines on what we're building, why, and the 1-2 concepts involved.
   b. PLAN: list the files you will touch and what each does. Wait for my "go".
   c. I WRITE THE CORE PIECE when it's a core-logic file (marked [ME] in the roadmap). You give me the
      interface/types and test cases; I write the function; you review it and explain what's wrong or could be better.
      You write the boilerplate/glue (marked [CLAUDE]) in small diffs, explaining each non-obvious part.
   d. VERIFY: we run it together (lint, typecheck, tests, manual check). You tell me exactly what to type/click.
   e. QUIZ: ask me 1-2 short questions about what we just built ("what happens if the STT returns an empty string?").
   f. COMMIT: propose a conventional commit message. Commit only after I say yes.
3. Never change more than ~60 lines without explaining them first. Prefer small, reviewable diffs.
4. If I ask for something that's a bad idea (security, scope, architecture), push back and explain the trade-off. Don't just comply.
5. If you are unsure, ask me. Do not guess silently.
6. Explain errors, don't just fix them. Show me how to read the stack trace.
7. Keep a running `docs/DECISIONS.md`: one short entry per important decision (what, why, alternatives).
8. Time-box: this is a hackathon. At the start of each milestone, tell me the realistic time and what we'll cut if we run late.

## Architecture (channel-agnostic core)
Channel (web/QR today, WhatsApp later) -> audio -> STT (speech-to-text) -> LLM extracts a JSON profile (NO decisions)
-> candidate confirms the profile ("Sizi belə başa düşdük") -> DETERMINISTIC code scores it against HR-defined criteria
-> HR panel shows ranked candidates with a per-criterion explanation.

Hard rules (do not violate, push back if I ask):
- The LLM only EXTRACTS facts into a schema. It never scores, ranks, accepts or rejects.
- Scoring is plain TypeScript: same input must give the same score. Unit-tested.
- The score uses transcript content ONLY. Never use voice, accent, tone, gender, age, ethnicity, religion, photo, or name.
  Do not extract those fields at all.
- The candidate must see and confirm (or fix) their extracted profile before it is scored/submitted.
- Consent checkbox before recording. Store the consent timestamp.
- The HR panel never auto-rejects. It only ranks and explains. Final decision = human.
- Every extracted field keeps an `evidence` quote from the transcript so HR can verify.

## Stack (keep it boring and fast)
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS. Deploy on Vercel from GitHub.
- DB + file storage: Supabase (Postgres + Storage) free tier. Access only from server routes (service key in env, never in the browser).
- STT: behind an interface `SttProvider { transcribe(audio: Buffer, mime: string): Promise<string> }`.
  Start with ONE provider (decide in M3 after testing 10 real Azerbaijani samples). Swappable later.
- LLM extraction: Claude API with a strict JSON schema, validated with Zod. Reject and retry once if the JSON is invalid.
- Validation: Zod everywhere on API inputs and LLM output.
- Tests: Vitest for the scoring + validation logic (must-have). Playwright only if time remains.
- Secrets only in `.env.local` and Vercel env vars. Provide `.env.example`. Never commit secrets.
- UI test hooks: follow the spec ID convention `data-testid="C-04-B5"` ([screen]-B[n]) on every button/input from the spec PDF in `docs/`.

## Data model (Postgres)
jobs(id, slug, title, location, description, questions jsonb, criteria jsonb, status, created_at)
applications(id, job_id, audio_path, transcript, profile jsonb, profile_confirmed bool, consent_at,
             score int, breakdown jsonb, status, created_at)

criterion = { id, label, field, op: 'bool_true' | 'number_gte' | 'in_list', value, weight }
profile (LLM output, Zod-validated) = {
  full_name, phone, district,
  experience_years: number | null,
  relevant_experience: string | null,
  available_from: string | null,
  can_work_shifts: boolean | null,
  can_work_weekends: boolean | null,
  has_driving_license: boolean | null,
  languages: string[],
  salary_expectation: number | null,
  evidence: Record<fieldName, string>   // short transcript quote per field
}
Unknown/unsaid => null. NEVER invent values.

Scoring: score = round(100 * sum(weights of criteria met) / sum(all weights)).
null (unknown) counts as NOT met but is shown as "not mentioned" in the breakdown (not as "failed").
Bands: 75-100 strong, 50-74 possible, 0-49 weak. Breakdown = per-criterion {met, weight, evidence}.

## API routes
POST /api/jobs                 create a job (HR)
GET  /api/jobs/[slug]          public job + questions for the apply flow
POST /api/apply/transcribe     audio -> transcript
POST /api/apply/extract        transcript -> validated profile (LLM)
POST /api/apply/confirm        confirmed profile -> score -> save application
GET  /api/hr/applications?jobId=   ranked list (HR only)
HR auth for the hackathon: single password from env `HR_PASSWORD`, httpOnly cookie. Note this is NOT production auth.

## Pages (IDs refer to the UI spec PDF in docs/)
Candidate: / (landing), /j/[slug] (C-screens: consent, mic check, question 1..n, review/confirm, done)
HR: /hr (login), /hr/jobs, /hr/jobs/new, /hr/jobs/[id] (ranked list), /hr/applications/[id] (detail + evidence)

## Definition of done for the demo
A judge scans a QR, records 2-3 answers in Azerbaijani on a phone, confirms the profile, and within seconds the
candidate appears ranked on the HR screen with a per-criterion explanation. Everything else is optional.

## Out of scope for the hackathon (say no if I drift)
WhatsApp/Telegram bots, real auth/multi-tenant, payments, ATS integrations, video, email, analytics dashboards, i18n beyond Azerbaijani + English labels.

## Code conventions
TypeScript strict, no `any`. Small pure functions in `src/lib/` (scoring.ts, schema.ts, stt/, llm/). UI in `src/components/`.
One responsibility per file. Comments explain WHY, not what. Run `npm run lint && npm run typecheck && npm test` before every commit.
