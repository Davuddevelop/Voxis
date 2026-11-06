-- Voxis schema. Applied to the Supabase project "voxis" (see docs/DECISIONS.md for why access goes through functions).
--
-- Security model: row level security is ON for every table and there are NO policies, so the public (anon) API key can
-- not read or write any row directly. The only way in is the app_* functions below, which are SECURITY DEFINER and
-- refuse to run unless the caller passes the server secret stored in app_config. Only our server code knows that
-- secret (Vercel env APP_DB_SECRET); it is never sent to a browser.

create table public.app_config (
  key   text primary key,
  value text not null
);
alter table public.app_config enable row level security;

create table public.jobs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  company     text not null default '',
  location    text not null default '',
  description text not null default '',
  questions   jsonb not null,
  criteria    jsonb not null,
  status      text not null default 'active' check (status in ('active', 'paused', 'closed')),
  created_at  timestamptz not null default now()
);
alter table public.jobs enable row level security;

create table public.applications (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs (id) on delete cascade,
  candidate_name    text not null,
  phone             text not null,
  answers           jsonb not null,            -- [{questionId, question, transcript}]
  extracted_profile jsonb not null,            -- what the AI understood
  profile           jsonb not null,            -- what the candidate confirmed (the score uses this)
  edited_fields     text[] not null default '{}', -- fields the candidate changed ("Namizəd düzəldib")
  consent_at        timestamptz not null,
  score             int not null check (score between 0 and 100),
  band              text not null check (band in ('high', 'medium', 'low')),
  breakdown         jsonb not null,
  status            text not null default 'new' check (status in ('new', 'viewed', 'interview', 'accepted', 'rejected')),
  created_at        timestamptz not null default now()
);
alter table public.applications enable row level security;
create index applications_job_score_idx on public.applications (job_id, score desc, created_at desc);

-- Guard used by every function below.
create or replace function public.app_check(p_secret text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or p_secret is distinct from (select value from public.app_config where key = 'server_secret') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

create or replace function public.app_job_create(p_secret text, p_job jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v public.jobs;
begin
  perform public.app_check(p_secret);
  insert into public.jobs (slug, title, company, location, description, questions, criteria, status)
  values (p_job->>'slug', p_job->>'title', coalesce(p_job->>'company', ''), coalesce(p_job->>'location', ''),
          coalesce(p_job->>'description', ''), p_job->'questions', p_job->'criteria', coalesce(p_job->>'status', 'active'))
  returning * into v;
  return to_jsonb(v);
end $$;

create or replace function public.app_job_list(p_secret text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.app_check(p_secret);
  return coalesce((
    select jsonb_agg(
      to_jsonb(j) || jsonb_build_object(
        'application_count', (select count(*) from public.applications a where a.job_id = j.id),
        'new_count', (select count(*) from public.applications a where a.job_id = j.id and a.status = 'new'))
      order by j.created_at desc)
    from public.jobs j), '[]'::jsonb);
end $$;

-- p_key is a slug (candidate link) or an id (HR pages). Returns null when there is no such job.
create or replace function public.app_job_get(p_secret text, p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.app_check(p_secret);
  return (select to_jsonb(j) from public.jobs j where j.slug = p_key or j.id::text = p_key limit 1);
end $$;

create or replace function public.app_job_set_status(p_secret text, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.app_check(p_secret);
  update public.jobs set status = p_status where id = p_id;
  return (select to_jsonb(j) from public.jobs j where j.id = p_id);
end $$;

create or replace function public.app_application_create(p_secret text, p_app jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v public.applications;
begin
  perform public.app_check(p_secret);
  insert into public.applications (job_id, candidate_name, phone, answers, extracted_profile, profile, edited_fields,
                                   consent_at, score, band, breakdown)
  values ((p_app->>'job_id')::uuid, p_app->>'candidate_name', p_app->>'phone', p_app->'answers',
          p_app->'extracted_profile', p_app->'profile',
          coalesce(array(select jsonb_array_elements_text(p_app->'edited_fields')), '{}'),
          (p_app->>'consent_at')::timestamptz, (p_app->>'score')::int, p_app->>'band', p_app->'breakdown')
  returning * into v;
  return to_jsonb(v);
end $$;

create or replace function public.app_application_list(p_secret text, p_job_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.app_check(p_secret);
  return coalesce((
    select jsonb_agg(to_jsonb(a) order by a.score desc, a.created_at desc)
    from public.applications a where a.job_id = p_job_id), '[]'::jsonb);
end $$;

create or replace function public.app_application_get(p_secret text, p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.app_check(p_secret);
  return (select to_jsonb(a) from public.applications a where a.id = p_id);
end $$;

create or replace function public.app_application_set_status(p_secret text, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.app_check(p_secret);
  update public.applications set status = p_status where id = p_id;
  return (select to_jsonb(a) from public.applications a where a.id = p_id);
end $$;
