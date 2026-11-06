import type { ReactNode } from "react";

type LinkButtonProps = {
  href: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
};

// An <a>, not a <button>: on this page every action is a link (to a section). min-h-12 = 48px,
// the spec's minimum touch target.
export function LinkButton({ href, variant = "primary", children }: LinkButtonProps) {
  const look =
    variant === "primary" ? "bg-white text-ink hover:bg-white/85" : "bg-ink-high text-white hover:bg-white/15";
  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center rounded-lg px-4 text-sm font-medium tracking-[-0.02em] transition-colors ${look}`}
    >
      {children}
    </a>
  );
}
