import { ArrowRight, Briefcase, Mic, MonitorPlay } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Logo } from "@/components/Logo";
import { Pill } from "@/components/landing/Pill";

export const metadata: Metadata = { title: "Başlayın — Voxis" };

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// The two sides of the product. In real life a candidate arrives from a QR code for one job; for the demo the candidate
// card opens the demo vacancy.
const CHOICES = [
  { href: "/v/demo", Icon: Mic, tag: "Namizəd", title: "Mən iş axtarıram", body: "İki suala səslə cavab verin. CV lazım deyil, təxminən 20 saniyə.", cta: "Müraciət et" },
  { href: "/hr/giris", Icon: Briefcase, tag: "HR rəhbəri", title: "Mən işçi axtarıram", body: "Prioritetləri təyin edin və namizədləri izahlı, sıralanmış siyahıda görün.", cta: "HR panelinə keç" },
];

export default function ChoosePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1080px] flex-col px-5 md:px-8">
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="inline-flex items-center gap-2.5 font-display text-xl font-medium tracking-[-0.04em]">
          <Logo size={30} decorative />
          Voxis
        </Link>
        <Link href="/" className="text-[13px] text-white/60 hover:text-white">← Ana səhifə</Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <div className="rise"><Pill>Başlayın</Pill></div>
        <h1 style={delay(100)} className="rise mt-6 font-display text-[clamp(2.5rem,7vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.045em]">
          Siz kimsiniz?
        </h1>
        <p style={delay(200)} className="rise mt-4 text-base text-white/60">Davam etmək üçün tərəfinizi seçin.</p>

        <div className="mt-12 grid gap-3 md:grid-cols-2">
          {CHOICES.map(({ href, Icon, tag, title, body, cta }, i) => (
            <Link
              key={href}
              href={href}
              style={delay(320 + i * 130)}
              className="rise group flex min-h-[300px] flex-col rounded-2xl bg-ink-raised p-8 transition-colors hover:bg-ink-high md:p-10"
            >
              <span className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.08em] text-white/50">{tag}</span>
                <Icon aria-hidden className="size-8 text-white/40 transition-colors group-hover:text-white" strokeWidth={1.25} />
              </span>
              <h2 className="mt-auto font-display text-3xl font-medium tracking-[-0.03em]">{title}</h2>
              <p className="mt-3 max-w-[34ch] text-sm leading-6 text-white/60">{body}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium">
                {cta}
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        {/* For the presenter: both sides on one screen, live. */}
        <Link
          href="/hr/sehne"
          style={delay(600)}
          className="rise mt-4 flex items-center gap-4 rounded-2xl border border-ink-high p-5 text-sm text-white/70 transition-colors hover:bg-ink-raised hover:text-white"
        >
          <MonitorPlay aria-hidden className="size-6 shrink-0 text-accent" strokeWidth={1.5} />
          <span><strong className="font-medium text-white">Təqdimat rejimi</strong> · namizəd və HR yan-yana, canlı</span>
          <span className="ml-auto hidden text-xs text-white/40 sm:inline">HR girişi tələb olunur</span>
        </Link>
      </main>
    </div>
  );
}
