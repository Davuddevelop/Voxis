"use client";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

// For rehearsals: removes the applications added while testing the demo, keeps the three "(nümunə)" samples.
export function ResetDemoButton() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function reset() {
    if (!window.confirm("Demo zamanı əlavə olunan müraciətlər silinəcək (nümunə namizədlər qalır). Davam edək?")) return;
    setBusy(true);
    const response = await fetch("/api/hr/demo/reset", { method: "POST" }).catch(() => null);
    const body = response?.ok ? ((await response.json()) as { removed: number }) : null;
    setNote(body ? `${body.removed} silindi` : "Alınmadı");
    setBusy(false);
    setTimeout(() => setNote(null), 3000);
  }

  return (
    <button type="button" onClick={reset} disabled={busy} data-testid="S-04-reset" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-surface disabled:opacity-50">
      <RotateCcw aria-hidden className="size-4" />
      {note ?? "Sıfırla"}
    </button>
  );
}
