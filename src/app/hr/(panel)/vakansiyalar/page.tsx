import { Plus } from "lucide-react";
import Link from "next/link";
import { JOB_STATUS_CLASS, JOB_STATUS_TEXT } from "@/components/hr/Badges";
import { listJobs } from "@/lib/db";
import { timeAgo } from "@/lib/format";

export default async function JobsPage() {
  const jobs = await listJobs().catch(() => null);
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vakansiyalar</h1>
        <Link href="/hr/vakansiyalar/yeni" data-testid="H-03-B1" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
          <Plus aria-hidden className="size-4" /> Yeni vakansiya
        </Link>
      </div>

      {jobs === null ? (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-danger">Məlumat yüklənmədi. Səhifəni yeniləyin.</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-12 text-center">
          <h2 className="text-lg font-semibold">Hələ vakansiya yoxdur</h2>
          <p className="mt-1 text-muted">İlk vakansiyanı yaradın, QR kodu paylaşın və müraciətlər burada görünsün.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>{["Vəzifə", "Filial", "Status", "Namizədlər", "Yeni", "Yaradılıb"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id} className="relative hover:bg-surface" data-testid="H-03-B4">
                  <td className="px-4 py-4 font-medium"><Link href={`/hr/vakansiyalar/${job.id}`} className="after:absolute after:inset-0">{job.title}</Link></td>
                  <td className="px-4 py-4 text-muted">{job.location || "—"}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${JOB_STATUS_CLASS[job.status]}`}>{JOB_STATUS_TEXT[job.status]}</span></td>
                  <td className="px-4 py-4 tabular-nums">{job.application_count ?? 0}</td>
                  <td className="px-4 py-4">{(job.new_count ?? 0) > 0 ? <span className="inline-flex items-center gap-1.5 font-semibold"><span aria-hidden className="size-2 rounded-full bg-blue-600" />{job.new_count}</span> : <span className="text-muted">0</span>}</td>
                  <td className="px-4 py-4 text-muted">{timeAgo(job.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
