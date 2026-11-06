import { describe, expect, it } from "vitest";
import { questionsForCriteria } from "./catalog";
import { createApplication, createJob, getApplication, getJob, listApplications, listJobs, setApplicationStatus } from "./db";
import { newSlug } from "./job-input";
import type { Criterion, Profile } from "./schema";
import { scoreProfile } from "./scoring";

// LIVE test against the real Supabase project. Run: set -a; . ./.env.local; set +a; LIVE=1 npx vitest run src/lib/db
// It leaves rows titled "ZZ TEST ..." behind; delete them with: delete from jobs where title like 'ZZ TEST%'.
const criteria: Criterion[] = [
  { id: "c1", label: "Növbəli", field: "can_work_shifts", op: "bool_true", priority: 5 },
  { id: "c2", label: "6 ay", field: "experience_months", op: "number_gte", value: 6, priority: 3 },
];
const profile: Profile = { experience_months: 4, can_work_shifts: true, can_work_weekends: null, languages: null, has_driving_license: null, available_within_days: null, evidence: { can_work_shifts: "növbəli işləyə bilərəm" } };

describe.skipIf(!process.env.LIVE)("database (live)", () => {
  it("round-trips a job and an application, ranks by score, and keeps the data private", { timeout: 60_000 }, async () => {
    const slug = newSlug();
    const job = await createJob({ slug, title: "ZZ TEST Kassir", company: "Test", location: "Bakı", description: "", questions: questionsForCriteria(criteria), criteria });
    expect(job.slug).toBe(slug);
    expect((await getJob(slug))?.id).toBe(job.id);
    expect((await getJob(job.id))?.slug).toBe(slug); // by id as well
    expect(await getJob("does-not-exist")).toBeNull();
    expect((await listJobs()).some((j) => j.id === job.id)).toBe(true);

    const result = scoreProfile(profile, criteria);
    const make = (name: string, score: number) => createApplication({ job_id: job.id, candidate_name: name, phone: "+994501234567", answers: [{ questionId: "schedule", question: "q", transcript: "t" }], extracted_profile: profile, profile, edited_fields: ["experience_months"], consent_at: new Date().toISOString(), score, band: result.band, breakdown: result.breakdown });
    const low = await make("Low", 20);
    const high = await make("High", 90);
    const ranked = await listApplications(job.id);
    expect(ranked.map((a) => a.candidate_name)).toEqual(["High", "Low"]); // best first
    expect(ranked[0]?.edited_fields).toEqual(["experience_months"]);
    expect(ranked[0]?.status).toBe("new");

    await setApplicationStatus(low.id, "interview");
    expect((await getApplication(low.id))?.status).toBe("interview");
    expect(high.score).toBe(90);

    // Security: the public key alone must not reach the data, and a wrong server secret must be refused.
    const url = process.env.SUPABASE_URL as string;
    const anon = process.env.SUPABASE_ANON_KEY as string;
    const direct = await fetch(`${url}/rest/v1/applications?select=candidate_name,phone`, { headers: { apikey: anon, authorization: `Bearer ${anon}` } });
    expect(await direct.json()).toEqual([]); // row security hides every row from the anon role
    const real = process.env.APP_DB_SECRET;
    process.env.APP_DB_SECRET = "wrong-secret";
    await expect(listJobs()).rejects.toThrow();
    process.env.APP_DB_SECRET = real;
  });
});
