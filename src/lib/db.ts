import "server-only";
import type { JobQuestion } from "./catalog";
import type { CriterionResult, ScoreBand } from "./scoring";
import type { Criterion, Profile } from "./schema";

// The only file that talks to the database. Every call goes to a Postgres function (see
// supabase/migrations/0001_init.sql) through Supabase's REST API. The public (anon) key is just the way in; the
// functions refuse to run without APP_DB_SECRET, which only this server holds.

export type JobStatus = "active" | "paused" | "closed";
export type ApplicationStatus = "new" | "viewed" | "interview" | "accepted" | "rejected";

export type JobRow = {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  description: string;
  questions: JobQuestion[];
  criteria: Criterion[];
  status: JobStatus;
  created_at: string;
  application_count?: number; // only in list results
  new_count?: number;
};

export type StoredAnswer = { questionId: string; question: string; transcript: string };

export type ApplicationRow = {
  id: string;
  job_id: string;
  candidate_name: string;
  phone: string;
  answers: StoredAnswer[];
  extracted_profile: Profile;
  profile: Profile;
  edited_fields: string[];
  consent_at: string;
  score: number;
  band: ScoreBand;
  breakdown: CriterionResult[];
  status: ApplicationStatus;
  created_at: string;
};

export class DbError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "DbError";
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new DbError(`${name} is not set`, 500);
  return value;
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const key = env("SUPABASE_ANON_KEY");
  const response = await fetch(`${env("SUPABASE_URL")}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ p_secret: env("APP_DB_SECRET"), ...args }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    // The body can contain database details, so it goes to the server log and not into the error that may travel on.
    console.error(`db ${fn} failed`, response.status, await response.text().catch(() => ""));
    throw new DbError(`Database call ${fn} failed`, response.status);
  }
  return (await response.json()) as T;
}

type NewJob = Pick<JobRow, "slug" | "title" | "company" | "location" | "description" | "questions" | "criteria">;
type NewApplication = Pick<ApplicationRow, "candidate_name" | "phone" | "answers" | "extracted_profile" | "profile" | "edited_fields" | "consent_at" | "score" | "band" | "breakdown"> & { job_id: string };

export const createJob = (job: NewJob) => rpc<JobRow>("app_job_create", { p_job: job });
export const listJobs = () => rpc<JobRow[]>("app_job_list");
export const getJob = (idOrSlug: string) => rpc<JobRow | null>("app_job_get", { p_key: idOrSlug });
export const setJobStatus = (id: string, status: JobStatus) => rpc<JobRow>("app_job_set_status", { p_id: id, p_status: status });
export const createApplication = (application: NewApplication) => rpc<ApplicationRow>("app_application_create", { p_app: application });
export const listApplications = (jobId: string) => rpc<ApplicationRow[]>("app_application_list", { p_job_id: jobId });
export const getApplication = (id: string) => rpc<ApplicationRow | null>("app_application_get", { p_id: id });
export const setApplicationStatus = (id: string, status: ApplicationStatus) => rpc<ApplicationRow>("app_application_set_status", { p_id: id, p_status: status });
