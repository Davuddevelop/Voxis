import type { CSSProperties } from "react";
import { AudioLines, BadgeCheck, Eye, Mic, QrCode, TextQuote, UserCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { GrainFrame } from "@/components/landing/GrainFrame";
import { LinkButton } from "@/components/landing/LinkButton";
import { Pill } from "@/components/landing/Pill";
import { ScoreSpecimen } from "@/components/landing/ScoreSpecimen";

// All copy lives here, in one place, so it can be edited or translated without touching the layout.
const STEPS = [
  {
    Icon: QrCode,
    title: "QR kodu skan edin",
    body: "Telefonun kamerası kifayətdir. Tətbiq yükləmək və qeydiyyatdan keçmək lazım deyil.",
  },
  {
    Icon: Mic,
    title: "Suallara səslə cavab verin",
    body: "Adətən üç sual. Hər cavab ən çoxu 60 saniyə.",
  },
  {
    Icon: BadgeCheck,
    title: "Profilinizi təsdiqləyin",
    body: "Sistem dediklərinizi yazıya çevirir. Səhv varsa, göndərməzdən əvvəl özünüz düzəldin.",
  },
];

const PRINCIPLES = [
  {
    Icon: UserCheck,
    label: "İnsan qərarı",
    body: "Süni intellekt yalnız yazıya çevirir və faktları çıxarır. Dəvət və imtina yalnız HR-ın düyməsi ilə olur.",
  },
  {
    Icon: AudioLines,
    label: "Yalnız sözlər",
    body: "Səs, aksent, ad, yaş və cins hesablamaya daxil deyil. Eyni cavab həmişə eyni bal verir.",
  },
  {
    Icon: Eye,
    label: "Siz təsdiqləyirsiniz",
    body: "Profil sizə göstərilir. Siz təsdiqləmədən heç nə göndərilmir və hesablanmır.",
  },
  {
    Icon: TextQuote,
    label: "Hər bal izahlı",
    body: "Hər xana üçün sizin öz sözünüzdən qısa sitat saxlanır ki, HR onu yoxlaya bilsin.",
  },
];

// Staggers the entrance of a group: each element waits a little longer than the one before.
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

const h2 = "text-balance font-display text-4xl font-medium leading-[1.08] tracking-[-0.04em] md:text-[2.5rem]";

export default function Home() {
  return (
    <div id="top" className="mx-auto w-full max-w-[1080px] px-5 md:px-8">
      <header className="flex items-center justify-between py-6">
        <a href="#top" className="inline-flex items-center gap-2.5 font-display text-xl font-medium tracking-[-0.04em]">
          <Logo size={30} decorative />
          Voxis
        </a>
        {/* Only in-page anchors: no link may point to a screen that does not exist yet. */}
        <nav aria-label="Bölmələr" className="hidden gap-8 text-[13px] text-white/70 md:flex">
          <a href="#nece" className="hover:text-white">Necə işləyir</a>
          <a href="#qaydalar" className="hover:text-white">Qaydalarımız</a>
          <a href="/hr/giris" className="hover:text-white">HR girişi</a>
        </nav>
        <LinkButton href="/baslayin">Başlayın</LinkButton>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="relative pb-24 pt-16 md:pt-24">
          <div aria-hidden className="dots pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]" />
          <div className="mx-auto max-w-[920px]">
            <div className="rise"><Pill>Səsli müraciət platforması</Pill></div>
            <h1
              id="hero-title"
              style={delay(120)}
              className="rise mt-8 font-display text-[clamp(2.5rem,7vw,3.75rem)] font-medium leading-[1.05] tracking-[-0.045em]"
            >
              <span className="block">CV lazım deyil.</span>
              <span className="block">Sadəcə danışın.</span>
            </h1>
            <p style={delay(260)} className="rise mt-8 max-w-[560px] text-base leading-7 tracking-[-0.02em] text-white/70">
              Namizəd telefonla QR kodu skan edir və suallara öz səsi ilə cavab verir. Sistem cavabları yazıya
              çevirir, HR isə namizədləri uyğunluğa görə sıralanmış və hər balı izah olunmuş siyahıda görür.
            </p>
            <div style={delay(380)} className="rise mt-8"><Pill tone="accent">Müraciət pulsuzdur · CV tələb olunmur</Pill></div>
            <div style={delay(480)} className="rise mt-5 flex flex-wrap gap-2">
              <LinkButton href="/baslayin">Başlayın</LinkButton>
              <LinkButton href="#nece" variant="secondary">Necə işləyir</LinkButton>
            </div>

            <div style={delay(640)} className="rise">
              <GrainFrame className="mt-16 p-3 sm:p-6 md:mt-24 md:p-14">
                <ScoreSpecimen />
              </GrainFrame>
            </div>
          </div>
        </section>

        <section id="nece" aria-labelledby="nece-title" className="scroll-mt-4 py-24">
          <Pill>Namizəd üçün</Pill>
          <h2 id="nece-title" className={`${h2} reveal mt-6 max-w-[16ch]`}>Üç addım, təxminən iki dəqiqə.</h2>
          <ol className="mt-14 grid gap-3 md:grid-cols-3">
            {STEPS.map(({ Icon, title, body }, i) => (
              <li key={title} className="reveal flex flex-col rounded-xl bg-ink-raised p-6 md:min-h-[260px]">
                <Icon aria-hidden className="size-7 text-white/50" strokeWidth={1.5} />
                <span className="mt-10 text-xs tabular-nums text-white/40 md:mt-auto">0{i + 1}</span>
                <h3 className="mt-2 font-display text-xl font-medium tracking-[-0.03em]">{title}</h3>
                {/* min-h = 3 lines, so the numbers and titles line up across the three cards. */}
                <p className="mt-2 text-sm leading-6 text-white/60 md:min-h-18">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="qaydalar" aria-labelledby="qaydalar-title" className="scroll-mt-4 py-24">
          <Pill>Qaydalarımız</Pill>
          <h2 id="qaydalar-title" className={`${h2} reveal mt-6 max-w-[20ch]`}>
            Hesablama sadə koddur, qərar insanındır.
          </h2>
          <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map(({ Icon, label, body }) => (
              <li key={label} className="reveal flex flex-col rounded-xl bg-ink-raised p-6 lg:min-h-[280px]">
                <Icon aria-hidden className="size-8 text-white/40" strokeWidth={1.25} />
                <h3 className="mt-10 text-xs uppercase tracking-[0.08em] text-white/90 lg:mt-auto">{label}</h3>
                {/* min-h = 5 lines (the longest body), so the labels line up across the four tiles. */}
                <p className="mt-3 text-[13px] leading-6 text-white/60 lg:min-h-30">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[13px] text-white/50">Süni intellekt yalnız tövsiyə edir — son qərar HR-dındır.</p>
        </section>

        <section id="basla" aria-labelledby="basla-title" className="scroll-mt-4 py-24">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="flex flex-col justify-center rounded-xl bg-ink-raised p-8 md:col-span-3 md:p-12">
              <Pill>Başlayın</Pill>
              <h2 id="basla-title" className={`${h2} mt-6`}>Namizədə iki dəqiqə. HR-a izahlı siyahı.</h2>
              <p className="mt-6 max-w-[440px] text-base leading-7 tracking-[-0.02em] text-white/70">
                Vakansiyanın QR kodunu skan edin və səslə müraciət edin. HR panelində namizədlər uyğunluğa görə
                sıralanır və hər bal izah olunur.
              </p>
              <div className="mt-8"><LinkButton href="/baslayin">Başlayın</LinkButton></div>
            </div>
            <GrainFrame className="reveal grid min-h-[280px] place-items-center md:col-span-2">
              <div className="rounded-xl bg-ink p-5">
                <QrCode aria-hidden className="size-20 text-white" strokeWidth={1} />
              </div>
            </GrainFrame>
          </div>
        </section>
      </main>

      <footer className="flex flex-col justify-between gap-2 border-t border-ink-high py-10 text-sm text-white/50 md:flex-row">
        <span className="inline-flex items-center gap-2.5 font-display text-base text-white"><Logo size={22} decorative />Voxis</span>
        <span>Hackathon prototipi · 2026</span>
      </footer>
    </div>
  );
}
