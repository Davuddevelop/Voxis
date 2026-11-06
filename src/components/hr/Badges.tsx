import { BAND_TEXT } from "@/lib/format";
import type { ApplicationStatus } from "@/lib/db";
import type { ScoreBand } from "@/lib/scoring";

// Score band colours (spec section 8): high green, medium amber, low NEUTRAL grey (never red: a low score is not a verdict).
const BAND_CLASS: Record<ScoreBand, string> = { high: "text-success", medium: "text-warning", low: "text-neutral" };
const BAND_BG: Record<ScoreBand, string> = { high: "bg-success/10", medium: "bg-warning/10", low: "bg-surface" };

export function ScoreBadge({ score, band }: { score: number; band: ScoreBand }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`text-lg font-semibold tabular-nums ${BAND_CLASS[band]}`}>{score}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BAND_CLASS[band]} ${BAND_BG[band]}`}>{BAND_TEXT[band]}</span>
    </span>
  );
}

const STATUS_TEXT: Record<ApplicationStatus, string> = { new: "Yeni", viewed: "Baxılıb", interview: "Müsahibə", accepted: "Qəbul edildi", rejected: "İmtina edildi" };
const STATUS_CLASS: Record<ApplicationStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  viewed: "bg-surface text-muted",
  interview: "bg-primary-light text-primary",
  accepted: "bg-success/10 text-success",
  rejected: "bg-surface text-neutral",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>{status === "new" && <span aria-hidden className="size-1.5 rounded-full bg-blue-600" />}{STATUS_TEXT[status]}</span>;
}

export const JOB_STATUS_TEXT = { active: "Aktiv", paused: "Dayandırılıb", closed: "Bağlanıb" } as const;
export const JOB_STATUS_CLASS = { active: "bg-success/10 text-success", paused: "bg-warning/10 text-warning", closed: "bg-surface text-neutral" } as const;
