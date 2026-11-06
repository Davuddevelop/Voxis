"use client";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

// Spec: a screen has ONE main button, fixed at the bottom; touch targets are at least 48x48 px.
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
  loading?: boolean;
};

const LOOK = {
  primary: "bg-primary text-white hover:bg-primary-hover disabled:bg-border disabled:text-muted",
  secondary: "border border-border bg-background text-text hover:bg-surface disabled:text-muted",
  text: "text-primary hover:bg-primary-light disabled:text-muted",
};

export function Button({ variant = "primary", loading, className = "", children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-base font-medium transition-colors disabled:cursor-not-allowed ${LOOK[variant]} ${className}`}
    >
      {loading && <Loader2 aria-hidden className="size-5 animate-spin" />}
      {children}
    </button>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 text-center text-muted">
      <Loader2 aria-hidden className="size-10 animate-spin text-primary" />
      <span>{label}</span>
    </div>
  );
}

type SegmentedProps<T extends string | number | boolean | null> = {
  label: string;
  value: T;
  options: { value: T; text: string }[];
  onChange: (value: T) => void;
  testId?: string;
};

// A row of mutually exclusive choices ("Bəli | Xeyr | Demədim"). Each is a real button with aria-pressed.
export function Segmented<T extends string | number | boolean | null>({ label, value, options, onChange, testId }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex gap-2" data-testid={testId}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-12 flex-1 rounded-lg border px-2 text-base transition-colors ${
            option.value === value ? "border-primary bg-primary-light font-medium text-primary" : "border-border bg-background text-text hover:bg-surface"
          }`}
        >
          {option.text}
        </button>
      ))}
    </div>
  );
}
