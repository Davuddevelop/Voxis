"use client";
import { Check, Copy, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/hr/logout", { method: "POST" });
        router.push("/hr/giris");
        router.refresh();
      }}
      data-testid="S-03-B6"
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface"
    >
      <LogOut aria-hidden className="size-4" /> Çıxış
    </button>
  );
}

export function CopyButton({ text, label, className = "", testId }: { text: string; label: string; className?: string; testId?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Kopyalayın:", text); // clipboard blocked (for example on plain http): let the person copy by hand
        }
      }}
      className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm hover:bg-surface ${className}`}
    >
      {copied ? <Check aria-hidden className="size-4 text-success" /> : <Copy aria-hidden className="size-4" />}
      {copied ? "Kopyalandı" : label}
    </button>
  );
}

export function JobStatusButtons({ jobId, status }: { jobId: string; status: "active" | "paused" | "closed" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function change(next: "active" | "paused" | "closed") {
    if (next === "closed" && !window.confirm("Vakansiya bağlanacaq və QR kod işləməyəcək. Davam edək?")) return;
    setBusy(true);
    await fetch(`/api/hr/jobs/${jobId}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    router.refresh();
  }
  const button = "min-h-10 rounded-lg border border-border px-3 text-sm hover:bg-surface disabled:opacity-50";
  return (
    <div className="flex gap-2">
      {status === "active" && <button type="button" disabled={busy} onClick={() => change("paused")} className={button} data-testid="H-03-B9">Dayandır</button>}
      {status === "paused" && <button type="button" disabled={busy} onClick={() => change("active")} className={button} data-testid="H-05-B7">Davam etdir</button>}
      {status !== "closed" && <button type="button" disabled={busy} onClick={() => change("closed")} className={`${button} text-danger`} data-testid="H-03-B10">Bağla</button>}
      {status === "closed" && <button type="button" disabled={busy} onClick={() => change("active")} className={button}>Yenidən aç</button>}
    </div>
  );
}
