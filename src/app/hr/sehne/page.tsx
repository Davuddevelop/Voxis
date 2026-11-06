import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ResetDemoButton } from "@/components/hr/ResetDemoButton";
import { getJob } from "@/lib/db";
import { isHr } from "@/lib/hr-auth";

export const metadata: Metadata = { title: "Canlı demo — Voxis", robots: { index: false, follow: false } };

// The stage screen. Left: the real candidate flow in a phone frame. Right: the live HR ranking. Both are ordinary pages
// in iframes (same address, so the HR login cookie is shared), which means nothing here is a mock-up: what a judge's
// application does on the left is exactly what shows up on the right, about two seconds after "Bitir" is pressed.
export default async function StagePage() {
  if (!(await isHr())) redirect("/hr/giris?next=/hr/sehne");
  const job = await getJob("demo").catch(() => null);

  if (!job) {
    return (
      <main className="grid min-h-dvh place-items-center bg-page p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Demo vakansiyası tapılmadı</h1>
          <p className="mt-2 text-muted">Terminalda işə salın: <code className="rounded bg-background px-2 py-1">npm run seed:demo</code></p>
        </div>
      </main>
    );
  }

  const label = "text-sm font-semibold uppercase tracking-wide text-muted";
  return (
    <main className="flex h-dvh flex-col bg-page text-text">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
        <span className="flex items-center gap-2.5 font-semibold"><Logo size={26} decorative />Voxis <span className="font-normal text-muted">· canlı demo</span></span>
        <nav aria-label="Demo alətləri" className="flex items-center gap-2">
          <ResetDemoButton />
          <a href={`/hr/qr/${job.id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-surface">Tam ekran QR</a>
          <a href={`/hr/vakansiyalar/${job.id}`} className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-surface">Əsas panel</a>
        </nav>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-6 p-6">
        <section aria-label="Namizəd tərəfi" className="flex min-h-0 flex-col gap-3">
          <h2 className={label}>1 · Namizəd (telefon)</h2>
          <div className="flex min-h-0 flex-1 justify-center">
            <div className="phone-frame overflow-hidden rounded-[2.6rem] border-[10px] border-ink-high bg-ink-high shadow-2xl">
              {/* allow="microphone": without it a browser may refuse recording inside a frame */}
              <iframe src={`/v/${job.slug}`} title="Namizəd" allow="microphone" className="size-full border-0 bg-page" />
            </div>
          </div>
        </section>

        <section aria-label="HR tərəfi" className="flex min-h-0 flex-col gap-3">
          <h2 className={label}>2 · HR (canlı siyahı)</h2>
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
            <iframe src={`/hr/embed/${job.id}`} title="HR" className="size-full border-0" />
          </div>
        </section>
      </div>
    </main>
  );
}
