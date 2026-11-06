import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JobBoard } from "@/components/hr/JobBoard";
import { isHr } from "@/lib/hr-auth";

export const metadata: Metadata = { title: "HR — Voxis", robots: { index: false, follow: false } };

// The HR board without the page chrome (no header, no logout, no way out): meant to sit inside the stage screen.
export default async function EmbeddedBoard(props: PageProps<"/hr/embed/[id]">) {
  if (!(await isHr())) redirect("/hr/giris");
  const { id } = await props.params;
  return (
    <div className="min-h-dvh bg-page px-5 py-5">
      <JobBoard jobId={id} query={await props.searchParams} base="/hr/embed" embedded />
    </div>
  );
}
