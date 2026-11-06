import { NextResponse } from "next/server";
import { createJob, DbError } from "@/lib/db";
import { isHr } from "@/lib/hr-auth";
import { fail } from "@/lib/http";
import { buildQuestions, JobInputSchema, newSlug } from "@/lib/job-input";

export async function POST(request: Request) {
  if (!(await isHr())) return fail(401, "unauthorized");
  const parsed = JobInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid_job");

  const { title, company, location, description, criteria, questionTexts } = parsed.data;
  const questions = buildQuestions(criteria, questionTexts);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const job = await createJob({ slug: newSlug(), title, company, location, description, questions, criteria });
      return NextResponse.json({ id: job.id, slug: job.slug });
    } catch (error) {
      if (error instanceof DbError && error.status === 409) continue; // the random slug collided: draw another
      console.error("create job failed:", error instanceof Error ? error.message : error);
      return fail(500, "db_error");
    }
  }
  return fail(500, "slug_collision");
}
