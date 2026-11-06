import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  index: string; // "01", "02", ...
  label: string;
  children: ReactNode;
};

// The editorial skeleton: a narrow column for the numbered label, a wide column for the content,
// and one hairline above. Every section uses it, which is what makes the page feel like one layout.
export function Section({ id, index, label, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-label`} className="border-t border-border py-16 md:py-28">
      <div className="grid gap-8 md:grid-cols-12 md:gap-10">
        <h2
          id={`${id}-label`}
          className="text-xs font-medium uppercase tracking-[0.14em] text-muted md:col-span-3"
        >
          <span className="mr-3 tabular-nums text-primary">{index}</span>
          {label}
        </h2>
        <div className="md:col-span-9">{children}</div>
      </div>
    </section>
  );
}
