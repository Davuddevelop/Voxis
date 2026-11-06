import type { ReactNode } from "react";

type PillProps = {
  tone?: "white" | "accent";
  className?: string;
  children: ReactNode;
};

// The small rounded marker in front of a label. It is the page's one repeated ornament:
// white for section labels, accent for reassurance ("pulsuzdur").
export function Pill({ tone = "white", className = "", children }: PillProps) {
  return (
    <p className={`inline-flex items-center gap-2.5 text-[13px] text-white/80 ${className}`}>
      <span aria-hidden className={`h-2 w-3.5 rounded-full ${tone === "accent" ? "bg-accent" : "bg-white"}`} />
      {children}
    </p>
  );
}
