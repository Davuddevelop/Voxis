"use client";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm({ next = "/hr/vakansiyalar" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/hr/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }).catch(() => null);
    if (response?.ok) return router.push(next);
    setError(response?.status === 429 ? "Çox cəhd oldu. Bir az gözləyin." : response ? "E-poçt və ya şifrə yanlışdır." : "Bağlantı yoxdur. Yenidən cəhd edin.");
    setBusy(false);
  }

  const field = "min-h-12 w-full rounded-lg border border-border px-3 text-base outline-none focus:border-primary";
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <p role="alert" data-testid="H-01-error" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">E-poçt</span>
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="H-01-email" className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Şifrə</span>
        <span className="relative">
          <input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="H-01-password" className={`${field} pr-12`} />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Şifrəni gizlət" : "Şifrəni göstər"} data-testid="H-01-B2" className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-muted hover:bg-surface">
            {show ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </span>
      </label>
      <button type="submit" disabled={busy || !email || !password} data-testid="H-01-B1" className="min-h-12 rounded-lg bg-primary px-4 text-base font-medium text-white hover:bg-primary-hover disabled:bg-border disabled:text-muted">
        {busy ? "Yoxlanılır…" : "Daxil ol"}
      </button>
    </form>
  );
}
