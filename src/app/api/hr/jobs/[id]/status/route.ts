import { NextResponse } from "next/server";
import { z } from "zod";
import { setJobStatus } from "@/lib/db";
import { isHr } from "@/lib/hr-auth";
import { fail } from "@/lib/http";

const Body = z.object({ status: z.enum(["active", "paused", "closed"]) });

export async function POST(request: Request, ctx: RouteContext<"/api/hr/jobs/[id]/status">) {
  if (!(await isHr())) return fail(401, "unauthorized");
  const { id } = await ctx.params;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !body.success) return fail(400, "bad_request");
  await setJobStatus(id, body.data.status);
  return NextResponse.json({ ok: true });
}
