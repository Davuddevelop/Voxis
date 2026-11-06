import { NextResponse } from "next/server";
import { endHrSession } from "@/lib/hr-auth";

export async function POST() {
  await endHrSession();
  return NextResponse.json({ ok: true });
}
