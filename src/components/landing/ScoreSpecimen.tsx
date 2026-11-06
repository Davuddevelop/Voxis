import { Check, CircleHelp, Contrast, X } from "lucide-react";

// The four result states and their look, from UI spec section 8. Colour never carries meaning alone:
// every state also has an icon and a word ("Rəng tək başına məna daşımır").
const STATUS = {
  met: { text: "Uyğundur", Icon: Check, className: "text-success" },
  partial: { text: "Qismən", Icon: Contrast, className: "text-warning" },
  not_met: { text: "Uyğun deyil", Icon: X, className: "text-danger" },
  unknown: { text: "Məlumat yoxdur", Icon: CircleHelp, className: "text-neutral" },
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
    <figure className="max-w-3xl">
      <figcaption className="mb-8 text-xs font-medium uppercase tracking-[0.14em] text-muted">
        Nümunə · HR panelində namizədin izahı
      </figcaption>

      <div className="flex items-baseline gap-3 border-b border-border pb-6">
        <span className="font-serif text-7xl font-light leading-none tracking-[-0.04em] tabular-nums md:text-8xl">
          63
        </span>
        <span className="text-lg text-muted">/ 100</span>
        <span className="ml-auto text-sm font-medium text-warning">Orta uyğunluq</span>
      </div>

      <table className="w-full text-left">
        <caption className="sr-only">Meyarlar üzrə nəticələr</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Meyar</th>
            <th scope="col">Nəticə</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ROWS.map(({ label, status, note }) => {
            const { text, Icon, className } = STATUS[status];
            return (
              <tr key={label}>
                <th scope="row" className="py-5 pr-4 align-top font-normal">
                  <span className="block text-base">{label}</span>
                  <span className="mt-1 block text-sm italic text-muted">{note}</span>
                </th>
                <td className="py-5 text-right align-top">
                  <span className={`inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ${className}`}>
                    <Icon aria-hidden className="size-4" />
                    {text}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-6 border-t border-border pt-6 text-sm text-muted">
        Süni intellekt yalnız tövsiyə edir — son qərar sizindir.
      </p>
    </figure>
  );
}
