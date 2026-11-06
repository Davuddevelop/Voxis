import { Check, CircleHelp, Contrast, X } from "lucide-react";
import type { CriterionStatus } from "@/lib/scoring";

// Spec section 8: the same state always has the same colour, icon and wording, on every screen. Colour is never the
// only signal: each chip also carries an icon and (for screen readers) the state's name.
export const STATUS_LOOK: Record<CriterionStatus, { text: string; Icon: typeof Check; className: string }> = {
  met: { text: "Uyğundur", Icon: Check, className: "bg-success/10 text-success" },
  partial: { text: "Qismən", Icon: Contrast, className: "bg-warning/10 text-warning" },
  not_met: { text: "Uyğun deyil", Icon: X, className: "bg-danger/10 text-danger" },
  unknown: { text: "Məlumat yoxdur", Icon: CircleHelp, className: "bg-surface text-neutral" },
};

export function CriterionChip({ status, label, compact = false }: { status: CriterionStatus; label?: string; compact?: boolean }) {
  const { text, Icon, className } = STATUS_LOOK[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`} title={`${label ? `${label}: ` : ""}${text}`}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {compact && label ? <span className="max-w-[9rem] truncate">{label}</span> : text}
      <span className="sr-only">{compact ? `${label ?? ""}: ${text}` : ""}</span>
    </span>
  );
}
