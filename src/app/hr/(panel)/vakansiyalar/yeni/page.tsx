import Link from "next/link";
import { JobForm } from "@/components/hr/JobForm";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/hr/vakansiyalar" className="text-sm text-muted hover:text-text">← Vakansiyalar</Link>
      <h1 className="mb-8 mt-2 text-2xl font-semibold">Yeni vakansiya</h1>
      <JobForm />
    </div>
  );
}
