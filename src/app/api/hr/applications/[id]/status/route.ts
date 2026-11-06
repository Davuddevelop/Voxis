import { NextResponse } from "next/server";
import { z } from "zod";
import { setApplicationStatus } from "@/lib/db";
import { isHr } from "@/lib/hr-auth";
import { fail } from "@/lib/http";

// The ONLY way an application's status changes is a person clicking a button here. Nothing in the system accepts
// or rejects anyone on its own (CLAUDE.md hard rule).
const Body = z.object({ status: z.enum(["new", "viewed", "interview", "accepted", "rejected"]) });

export async function POST(request: Request, ctx: RouteContext<"/api/hr/applications/[id]/status">) {
  if (!(await isHr())) return fail(401, "unauthorized");
  const { id } = await ctx.params;
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!z.uuid().safeParse(id).success || !body.success) return fail(400, "bad_request");
  await setApplicationStatus(id, body.data.status);
  return NextResponse.json({ ok: true });
}
