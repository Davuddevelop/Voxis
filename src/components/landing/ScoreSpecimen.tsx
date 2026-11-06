import { Check, CircleHelp, Contrast, X } from "lucide-react";

// The four result states and their look, from UI spec section 8. Colour never carries meaning alone:
// every state also has an icon and a word ("Rəng tək başına məna daşımır"). The colours are the
// lightened "on-dark" variants (see globals.css) so the text passes contrast on the dark card.
const STATUS = {
  met: { text: "Uyğundur", Icon: Check, className: "text-success-on-dark" },
  partial: { text: "Qismən", Icon: Contrast, className: "text-warning-on-dark" },
  not_met: { text: "Uyğun deyil", Icon: X, className: "text-danger-on-dark" },
  unknown: { text: "Məlumat yoxdur", Icon: CircleHelp, className: "text-neutral-on-dark" },
} as const;

// An illustrative candidate for the demo cashier job (weights 3, 3, 1, 1; total 8). The score is derived,
// not invented: partial 4/6 months earns 3 * 4/6 = 2, shifts earn 3, the other two earn 0, so
// round(100 * 5 / 8) = 63. Once scoreProfile exists this page can compute it instead of hard-coding it.
const ROWS = [
  { label: "Ən azı 6 ay təcrübə", status: "partial", note: "“Dörd aydır marketdə kassir işləyirəm.”" },
  { label: "Növbəli işləyə bilər", status: "met", note: "“Növbəli işləyə bilərəm.”" },
  { label: "Həftəsonu işləyə bilər", status: "not_met", note: "“Həftəsonu işləyə bilmirəm.”" },
  { label: "Rus dili", status: "unknown", note: "Namizəd bu barədə danışmayıb." },
] as const;

export function ScoreSpecimen() {
  return (
    <figure className="mx-auto w-full max-w-[560px] rounded-lg bg-ink-raised p-5 sm:p-8">
      <figcaption className="mb-8 text-xs uppercase tracking-[0.08em] text-white/50">
        Nümunə · HR panelində namizədin izahı
      </figcaption>

      <div className="flex items-baseline gap-3 border-b border-ink-high pb-6">
        <span className="font-display text-7xl font-medium leading-none tracking-[-0.05em] tabular-nums">63</span>
        <span className="text-base text-white/50">/ 100</span>
        <span className="ml-auto text-sm text-warning-on-dark">Orta uyğunluq</span>
      </div>

      {/* A list, not a table: on a phone each row stacks (label, quote, then result) instead of squeezing
          three columns into 270px. Each item still reads in order for a screen reader. */}
      <ul className="divide-y divide-ink-high">
        {ROWS.map(({ label, status, note }) => {
          const { text, Icon, className } = STATUS[status];
          return (
            <li key={label} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div>
                <p className="font-display text-base tracking-[-0.02em]">{label}</p>
                <p className="mt-1 text-xs leading-5 text-white/50">{note}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm ${className}`}>
                <Icon aria-hidden className="size-4" />
                {text}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-ink-high pt-5 text-xs text-white/50">
        Süni intellekt yalnız tövsiyə edir — son qərar sizindir.
      </p>
    </figure>
  );
}
