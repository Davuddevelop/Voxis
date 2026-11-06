import type { Metadata } from "next";
import { ApplyFlow } from "@/components/apply/ApplyFlow";
import { getJob } from "@/lib/db";

// Candidate pages are for people with the link only: keep them out of search engines.
export const metadata: Metadata = { title: "Müraciət — Voxis", robots: { index: false, follow: false } };

// Spec S-02: a candidate must never see an empty or technical error page.
function Notice({ title, text }: { title: string; text: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-5 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-base text-muted">{text}</p>
    </main>
  );
}

export default async function ApplyPage(props: PageProps<"/v/[kod]">) {
  const { kod } = await props.params;
  const job = await getJob(kod).catch(() => "error" as const);

  if (job === "error") return <Notice title="Bağlantı yoxdur" text="Bir az sonra yenidən cəhd edin." />;
  if (!job) return <Notice title="Bu link işləmir" text="QR kodu yenidən skan edin və ya linki yoxlayın." />;
  if (job.status === "paused") return <Notice title="Müraciət müvəqqəti dayandırılıb" text="Bu vakansiyaya hazırda müraciət qəbul olunmur." />;
  if (job.status === "closed") return <Notice title="Vakansiya bağlanıb" text="Maraq göstərdiyiniz üçün təşəkkür edirik." />;

  // Only what a candidate may know. The criteria, their values and priorities stay on the server.
  return (
    <ApplyFlow
      job={{
        slug: job.slug,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        questions: job.questions,
        fields: [...new Set(job.criteria.map((c) => c.field))],
      }}
    />
  );
}
