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
   c. I WRITE THE CORE PIECE when it's a core-logic file. You give me the interface/types and test cases; I write the
      function; you review it and explain what's wrong or could be better. You write the boilerplate/glue in small
      diffs, explaining each non-obvious part.
   d. VERIFY: we run it together (lint, typecheck, tests, manual check). You tell me exactly what to type/click.
   e. QUIZ: ask me 1-2 short questions about what we just built.
   f. COMMIT: propose a conventional commit message. Commit only after I say yes.
3. Never change more than ~60 lines without explaining them first. Prefer small, reviewable diffs.
4. If I ask for something that's a bad idea (security, scope, architecture), push back and explain the trade-off. Don't just comply.
5. If you are unsure, ask me. Do not guess silently.
6. Explain errors, don't just fix them. Show me how to read the stack trace.
7. Keep a running `docs/DECISIONS.md`: one short entry per important decision (what, why, alternatives).
8. Time-box: this is a hackathon. At the start of each milestone, tell me the realistic time and what we'll cut if we run late.

> **2026-11-06 exception:** with limited hackathon time I explicitly asked Claude to build the first complete system
> end to end ("I don't care what way you go"). It did, and wrote `docs/HOW-IT-WORKS.md` so I can learn it afterwards.
> From the next session on, the loop above applies again unless I say otherwise. When I change something, explain the
> change against HOW-IT-WORKS.md first.

## Architecture (channel-agnostic core)
Channel (web/QR today, WhatsApp later) -> audio -> STT (speech-to-text) -> LLM extracts a JSON profile (NO decisions)
-> candidate confirms the profile ("Sizi belə başa düşdük") -> DETERMINISTIC code scores it against HR-defined criteria
-> HR panel shows ranked candidates with a per-criterion explanation.

Hard rules (do not violate, push back if I ask):
- The LLM only EXTRACTS facts into a schema. It never scores, ranks, accepts or rejects.
- Scoring is plain TypeScript: same input must give the same score. Unit-tested.
- The score uses transcript content ONLY. Never use voice, accent, tone, gender, age, ethnicity, religion, photo, or name.
  The profile schema has no field for any of them, and HR cannot create a criterion on them (spec H-04).
- The candidate must see and confirm (or fix) their extracted profile before it is scored/submitted.
- Consent checkbox before recording. Store the consent timestamp.
- The HR panel never auto-rejects. It only ranks and explains. Final decision = human (a button click).
- Every extracted field keeps an `evidence` quote from the transcript so HR can verify. A value whose quote is not
  really in the transcript is thrown away (src/lib/llm/extract.ts, enforceEvidence).
- The candidate never sees their score or the criteria.

## Stack
- Next.js 16 (App Router) + TypeScript (strict) + Tailwind 4. Cache Components is OFF (see DECISIONS.md). Deployed on
  Vercel from GitHub (functions in fra1). Read node_modules/next/dist/docs/ before using a Next.js API you are unsure of.
- DB: Supabase Postgres (project "voxis"). Row security ON with no policies; the app reaches data only through
  `app_*` SECURITY DEFINER functions that require APP_DB_SECRET (src/lib/db.ts). See supabase/migrations/.
- STT and extraction: Google Gemini (src/lib/gemini.ts: model fallback chain, retries). STT sits behind the
  `SttProvider` interface (src/lib/stt/). Browser recordings are converted to 16 kHz mono WAV before upload.
- Validation: Zod everywhere on API input and on model output. Tests: Vitest (+ opt-in live tests with LIVE=1).
- Secrets only in `.env.local` and Vercel env vars (`.env.example` lists the names). Never commit secrets.
- UI test hooks: `data-testid="C-04-B5"` ([screen]-B[n], IDs from the spec PDF in docs/).

## Domain model (source of truth: src/lib/schema.ts and src/lib/catalog.ts)
Profile = six facts, each `null` when the candidate did not say (null is NOT the same as 0/false):
  experience_months, can_work_shifts, can_work_weekends, languages (ISO codes, never empty), has_driving_license,
  available_within_days (0 = immediately), plus `evidence` (field -> transcript quote).
Criterion = { id, label, field, op, value?, priority 1-5 }. Priority IS the weight. Ops are pinned to fields:
  bool_true (shifts, weekends, license), number_gte (experience_months), number_lte (available_within_days),
  in_list (languages: any match). HR's `label` is display text only: no code or LLM ever evaluates it.
Questions are derived from the criteria (4 topics: experience, schedule, languages, logistics); HR may reword them.

Scoring (src/lib/scoring.ts): score = round-half-up(100 * sum(credit) / sum(weights)). credit = weight if met,
weight * ratio if partial (only number_gte, ratio >= 0.5), else 0. Status: met | partial | not_met | unknown (unknown =
null = 0 credit, shown as "Məlumat yoxdur", never as "Uyğun deyil"). Bands: 75-100 high, 50-74 medium, 0-49 low.
Throws on empty criteria or a threshold <= 0 (a silent 0 would rank everyone low).

Tables: jobs(id, slug, title, company, location, description, questions, criteria, status, created_at) and
applications(id, job_id, candidate_name, phone, answers, extracted_profile, profile, edited_fields, consent_at, score,
band, breakdown, status, created_at).

## Routes
Candidate (one page, state machine): /v/[kod]
HR: /hr/giris (login), /hr/vakansiyalar (list), /hr/vakansiyalar/yeni (create), /hr/vakansiyalar/[id] (QR + link +
ranked list; ?namized=[id] opens the side panel). Landing page: / (own layout, dark theme).
API: POST /api/apply/transcribe, /api/apply/extract, /api/apply/confirm (public, rate-limited, validated);
POST /api/hr/login, /api/hr/logout, /api/hr/jobs, /api/hr/jobs/[id]/status, /api/hr/applications/[id]/status (HR cookie).

## Definition of done for the demo
A judge scans a QR, records 2-3 answers in Azerbaijani on a phone, confirms the profile, and within seconds the
candidate appears ranked on the HR screen with a per-criterion explanation.

## Out of scope for the hackathon (say no if I drift)
WhatsApp/Telegram bots, real auth/multi-tenant, payments, ATS integrations, video, email, analytics dashboards, i18n
beyond Azerbaijani + English labels, age/gender/appearance criteria (never).

## Code conventions
TypeScript strict, no `any`. Small pure functions in `src/lib/`. UI in `src/components/`. One responsibility per file.
Comments explain WHY, not what. Run `npm run lint && npm run typecheck && npm test` before every commit.
Live tests (real Gemini / real database) run only on request: `set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 LIVE=1 npx vitest run <path>`.
