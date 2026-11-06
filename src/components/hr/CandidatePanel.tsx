import { Phone, X } from "lucide-react";
import Link from "next/link";
import type { ApplicationRow, JobRow } from "@/lib/db";
import { BAND_TEXT, initials, timeAgo } from "@/lib/format";
import { CopyButton } from "./ClientButtons";
import { CriterionChip } from "./CriterionChip";
import { DecisionActions } from "./DecisionActions";
import { StatusBadge } from "./Badges";

// Spec H-07: the most important HR screen. Why this score, in the candidate's own words, and a human decision.
export function CandidatePanel({ application: a, job, closeHref }: { application: ApplicationRow; job: JobRow; closeHref: string }) {
  const bandColor = { high: "text-success", medium: "text-warning", low: "text-neutral" }[a.band];
  return (
    <>
      <Link href={closeHref} aria-label="Paneli bağla" className="fixed inset-0 z-30 bg-black/50" />
      <aside aria-label="Namizəd paneli" data-testid="H-07" className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[560px] flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center gap-4 border-b border-border px-6 py-4">
          <span aria-hidden className="grid size-11 place-items-center rounded-full bg-primary-light font-semibold text-primary">{initials(a.candidate_name)}</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{a.candidate_name}</h2>
            <div className="mt-1"><StatusBadge status={a.status} /></div>
          </div>
          <Link href={closeHref} aria-label="Bağla" data-testid="H-07-B3" className="grid size-10 place-items-center rounded-lg hover:bg-surface"><X aria-hidden className="size-5" /></Link>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <a href={`tel:${a.phone}`} className="inline-flex items-center gap-2 font-medium text-text"><Phone aria-hidden className="size-4" />{a.phone}</a>
            <CopyButton text={a.phone} label="Nömrəni kopyala" testId="H-07-B5" />
            <span>Müraciət: {timeAgo(a.created_at)}</span>
          </div>

          <section aria-labelledby="fit">
            <h3 id="fit" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Uyğunluq</h3>
            <p className="mb-5 flex items-baseline gap-2">
              <span className={`text-[2rem] font-semibold leading-none tabular-nums ${bandColor}`} data-testid="H-07-score">{a.score}</span>
              <span className="text-muted">/ 100</span>
              <span className={`ml-2 text-sm font-medium ${bandColor}`}>{BAND_TEXT[a.band]} uyğunluq</span>
            </p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {job.criteria.map((criterion) => {
                const result = a.breakdown.find((b) => b.criterionId === criterion.id);
                if (!result) return null;
                const edited = a.edited_fields.includes(criterion.field);
                return (
                  <li key={criterion.id} className="flex flex-col gap-2 p-4" data-testid="H-07-criterion">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{criterion.label}</p>
                        <p className="text-xs text-muted">Prioritet {criterion.priority} / 5</p>
                      </div>
                      <CriterionChip status={result.status} />
                    </div>
                    {edited && <p className="text-xs font-medium text-warning">Namizəd düzəldib</p>}
                    {result.evidence ? <p className="text-sm italic text-muted">“{result.evidence}”</p> : result.status === "unknown" ? <p className="text-sm text-muted">Namizəd bu barədə danışmayıb.</p> : null}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted">Süni intellekt yalnız tövsiyə edir — son qərar sizindir.</p>
          </section>

          <section aria-labelledby="answers">
            <h3 id="answers" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Cavablar</h3>
            <ul className="flex flex-col gap-4">
              {a.answers.map((answer) => (
                <li key={answer.questionId} className="rounded-xl bg-surface p-4">
                  <p className="text-sm font-medium">{answer.question}</p>
                  <p className="mt-2 text-sm">{answer.transcript || "—"}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="border-t border-border px-6 py-4">
          <DecisionActions applicationId={a.id} status={a.status} name={a.candidate_name} company={job.company} jobTitle={job.title} location={job.location} />
        </div>
      </aside>
    </>
  );
}
