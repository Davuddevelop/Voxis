import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { JOB_STATUS_CLASS, JOB_STATUS_TEXT, ScoreBadge, StatusBadge } from "@/components/hr/Badges";
import { AutoRefresh } from "@/components/hr/AutoRefresh";
import { CandidatePanel } from "@/components/hr/CandidatePanel";
import { CopyButton, JobStatusButtons } from "@/components/hr/ClientButtons";
import { CriterionChip } from "@/components/hr/CriterionChip";
import { getJob, listApplications, setApplicationStatus, type ApplicationRow, type ApplicationStatus } from "@/lib/db";
import { initials, timeAgo } from "@/lib/format";
import { siteOrigin } from "@/lib/origin";

// Spec H-05 (QR and link) + H-06 (ranked candidates) + H-07 (side panel, opened by ?namized=<id>).
const TABS: { key: "all" | ApplicationStatus; text: string }[] = [
  { key: "all", text: "Hamısı" },
  { key: "new", text: "Yeni" },
  { key: "viewed", text: "Baxılıb" },
  { key: "interview", text: "Müsahibə" },
  { key: "accepted", text: "Qəbul edildi" },
  { key: "rejected", text: "İmtina edildi" },
];

export default async function JobPage(props: PageProps<"/hr/vakansiyalar/[id]">) {
  const { id } = await props.params;
  const query = await props.searchParams;
  const job = await getJob(id).catch(() => null);
  if (!job) notFound();

  let applications: ApplicationRow[] = await listApplications(job.id).catch(() => []);

  // Spec H-07: opening a "new" candidate marks them as seen. (A person opened it; nothing automatic decides anyone.)
  const selectedId = typeof query.namized === "string" ? query.namized : undefined;
  const opened = applications.find((a) => a.id === selectedId);
  if (opened?.status === "new") {
    await setApplicationStatus(opened.id, "viewed").catch(() => undefined);
    applications = applications.map((a) => (a.id === opened.id ? { ...a, status: "viewed" } : a));
  }
  const selected = applications.find((a) => a.id === selectedId);

  const tab = TABS.find((t) => t.key === query.status)?.key ?? "all";
  const visible = tab === "all" ? applications : applications.filter((a) => a.status === tab);
  const count = (key: (typeof TABS)[number]["key"]) => (key === "all" ? applications.length : applications.filter((a) => a.status === key).length);
  const hrefFor = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ ...(tab !== "all" ? { status: tab } : {}), ...extra });
    return `/hr/vakansiyalar/${job.id}${params.size ? `?${params}` : ""}`;
  };

  const link = `${await siteOrigin()}/v/${job.slug}`;
  const qr = await QRCode.toString(link, { type: "svg", margin: 1, width: 176, color: { dark: "#1F2328", light: "#FFFFFF" } });

  return (
    <>
      <AutoRefresh />
      <Link href="/hr/vakansiyalar" className="text-sm text-muted hover:text-text">← Vakansiyalar</Link>

      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="mt-1 flex items-center gap-3 text-sm text-muted">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${JOB_STATUS_CLASS[job.status]}`}>{JOB_STATUS_TEXT[job.status]}</span>
            {[job.company, job.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <JobStatusButtons jobId={job.id} status={job.status} />
      </div>

      <section aria-label="Meyarlar və prioritetlər" className="mb-6 flex flex-wrap items-center gap-2" data-testid="H-06-criteria">
        <span className="text-sm font-medium text-muted">Meyarlar (prioritet):</span>
        {[...job.criteria].sort((a, b) => b.priority - a.priority).map((c) => (
          <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3 text-sm">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-white">{c.priority}</span>
            {c.label}
          </span>
        ))}
      </section>

      <section aria-label="QR kod və paylaşım" className="mb-8 grid gap-6 rounded-xl border border-border bg-background p-6 md:grid-cols-[auto_1fr]" data-testid="H-05">
        {/* The SVG is generated here from our own URL, never from user input, so inlining it is safe. */}
        <div className="size-44 overflow-hidden rounded-lg border border-border" role="img" aria-label="Vakansiya QR kodu" dangerouslySetInnerHTML={{ __html: qr }} />
        <div className="flex min-w-0 flex-col justify-center gap-3">
          <h2 className="text-lg font-semibold">Namizədlər üçün QR kod və link</h2>
          <p className="text-sm text-muted">QR kodu çap edin və ya linki göndərin. Namizəd telefonla açıb səslə müraciət edir.</p>
          <code className="truncate rounded-lg bg-surface px-3 py-2 text-sm" data-testid="H-05-link">{link}</code>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={link} label="Linki kopyala" testId="H-05-B1" />
            <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`} download={`voxis-${job.slug}.svg`} data-testid="H-05-B2" className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm hover:bg-surface">QR yüklə (SVG)</a>
            <a href={`/hr/qr/${job.id}`} target="_blank" rel="noreferrer" data-testid="H-05-B3" className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm hover:bg-surface">Tam ekran QR</a>
            <a href={`/v/${job.slug}`} target="_blank" rel="noreferrer" data-testid="H-05-B5" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-surface"><ExternalLink aria-hidden className="size-4" />Namizəd kimi bax</a>
          </div>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Status">
        {TABS.map((t) => (
          <Link key={t.key} role="tab" aria-selected={tab === t.key} href={t.key === "all" ? `/hr/vakansiyalar/${job.id}` : `/hr/vakansiyalar/${job.id}?status=${t.key}`} data-testid="H-06-B4" className={`rounded-full px-4 py-1.5 text-sm ${tab === t.key ? "bg-primary font-medium text-white" : "bg-background text-muted hover:bg-primary-light"}`}>
            {t.text} <span className="tabular-nums opacity-80">{count(t.key)}</span>
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-12 text-center" data-testid="H-06-empty">
          <h2 className="text-lg font-semibold">Hələ müraciət yoxdur</h2>
          <p className="mt-1 text-muted">QR kodu paylaşın.</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-border bg-background p-8 text-center text-muted">Bu filtrə uyğun namizəd yoxdur.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm" data-testid="H-06-table">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>{["Namizəd", "Bal", "Meyarlar", "Müraciət", "Status"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((a) => (
                <tr key={a.id} className={`relative hover:bg-surface ${a.id === selectedId ? "bg-primary-light/50" : ""}`} data-testid="H-06-B9">
                  <td className="px-4 py-4">
                    <Link href={hrefFor({ namized: a.id })} className="flex items-center gap-3 after:absolute after:inset-0">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-light text-xs font-semibold text-primary">{initials(a.candidate_name)}</span>
                      <span className={a.status === "new" ? "font-semibold" : ""}>{a.candidate_name}</span>
                      {a.status === "new" && <span aria-label="Yeni" className="size-2 rounded-full bg-blue-600" />}
                    </Link>
                  </td>
                  <td className="px-4 py-4"><ScoreBadge score={a.score} band={a.band} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {job.criteria.map((c) => {
                        const result = a.breakdown.find((b) => b.criterionId === c.id);
                        return result ? <CriterionChip key={c.id} status={result.status} label={c.label} compact /> : null;
                      })}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted">{timeAgo(a.created_at)}</td>
                  <td className="px-4 py-4"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <CandidatePanel application={selected} job={job} closeHref={hrefFor({})} />}
    </>
  );
}
