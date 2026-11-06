import { ScoreSpecimen } from "@/components/landing/ScoreSpecimen";
import { Section } from "@/components/landing/Section";

// All copy lives here, in one place, so it can be edited or translated without touching the layout.
const STEPS = [
  {
    title: "QR kodu skan edin",
    body: "Telefonun kamerası kifayətdir. Tətbiq yükləmək və qeydiyyatdan keçmək lazım deyil.",
  },
  {
    title: "Suallara səslə cavab verin",
    body: "Adətən üç sual. Hər cavab ən çoxu 60 saniyə, hamısı təxminən iki dəqiqə.",
  },
  {
    title: "Profilinizi təsdiqləyin",
    body: "Sistem dediklərinizi yazıya çevirir. Səhv varsa, göndərməzdən əvvəl özünüz düzəldin.",
  },
];

const PRINCIPLES = [
  {
    title: "Qərarı insan verir.",
    body: "Süni intellekt yalnız dediklərinizi yazıya çevirir və faktları çıxarır. Dəvət və imtina yalnız HR-ın düyməsi ilə olur.",
  },
  {
    title: "Bal yalnız sözlərinizə baxır.",
    body: "Səs, aksent, ad, yaş və cins hesablamaya daxil deyil. Hesablama sadə koddur: eyni cavab həmişə eyni bal verir.",
  },
  {
    title: "Siz əvvəl görürsünüz.",
    body: "Profil sizə göstərilir. Siz təsdiqləmədən heç nə göndərilmir və heç nə hesablanmır.",
  },
  {
    title: "Hər nəticənin sübutu var.",
    body: "Hər xana üçün sizin öz sözünüzdən qısa sitat saxlanır ki, HR onu bir baxışda yoxlaya bilsin.",
  },
];

const eyebrow = "text-xs font-medium uppercase tracking-[0.14em] text-muted";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 md:px-10">
      <header className="flex items-baseline justify-between py-6">
        <span className="font-serif text-2xl tracking-[-0.02em]">Voxis</span>
        {/* Only in-page anchors: no link may point to a screen that does not exist yet. */}
        <nav aria-label="Bölmələr" className="hidden gap-8 text-sm text-muted md:flex">
          <a href="#nece" className="hover:text-text">Necə işləyir</a>
          <a href="#hr" className="hover:text-text">HR üçün</a>
          <a href="#qaydalar" className="hover:text-text">Qaydalarımız</a>
        </nav>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="pb-20 pt-16 md:pb-32 md:pt-28">
          <p className={`${eyebrow} mb-10 flex items-center gap-3`}>
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            Səsli müraciət platforması
          </p>
          <h1
            id="hero-title"
            className="font-serif text-[clamp(3rem,14.5vw,9rem)] font-light leading-[0.92] tracking-[-0.035em] md:text-[clamp(4rem,11vw,9rem)]"
          >
            CV lazım deyil.
            <br />
            <span className="italic text-muted">Sadəcə danışın.</span>
          </h1>

          <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-12 md:gap-10">
            <p className="text-xl leading-8 md:col-span-5 md:col-start-7">
              Namizəd telefonla QR kodu skan edir və suallara öz səsi ilə cavab verir. Sistem cavabları yazıya
              çevirir; HR isə namizədləri uyğunluğa görə sıralanmış və hər balı izah olunmuş siyahıda görür.
            </p>
          </div>

          <p className="mt-16 border-t border-border pt-6 text-base text-muted md:mt-24">
            Namizədsinizmi? Vakansiyanın QR kodunu telefonunuzun kamerası ilə skan edin. Müraciət pulsuzdur.
          </p>
        </section>

        <Section id="nece" index="01" label="Necə işləyir">
          <ol className="divide-y divide-border">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid gap-3 py-8 first:pt-0 md:grid-cols-9 md:gap-8">
                <span className="font-serif text-3xl tabular-nums text-muted md:col-span-1">{i + 1}</span>
                <h3 className="text-balance font-serif text-3xl leading-tight tracking-[-0.02em] md:col-span-4 md:text-4xl">
                  {step.title}
                </h3>
                <p className="text-base leading-7 text-muted md:col-span-4">{step.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="hr" index="02" label="HR üçün">
          <p className="max-w-3xl font-serif text-4xl font-light leading-[1.08] tracking-[-0.025em] md:text-6xl">
            Bal heç vaxt izahsız göstərilmir.
          </p>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted">
            Namizədlər uyğunluğa görə sıralanır. Hər balın yanında meyar-meyar nəticə və namizədin öz sözündən
            sitat olur ki, qərarı özünüz yoxlayıb verəsiniz.
          </p>
          <div className="mt-16">
            <ScoreSpecimen />
          </div>
        </Section>

        <Section id="qaydalar" index="03" label="Qaydalarımız">
          <dl className="grid gap-x-12 gap-y-12 md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="border-t border-border pt-6 max-md:first:border-t-0 max-md:first:pt-0">
                <dt className="font-serif text-2xl tracking-[-0.015em] md:text-3xl">{p.title}</dt>
                <dd className="mt-3 text-base leading-7 text-muted">{p.body}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </main>

      <footer className="flex flex-col justify-between gap-2 border-t border-border py-10 text-sm text-muted md:flex-row">
        <span className="font-serif text-base text-text">Voxis</span>
        <span>Hackathon prototipi · 2026</span>
      </footer>
    </div>
  );
}
