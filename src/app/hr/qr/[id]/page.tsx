import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { getJob } from "@/lib/db";
import { isHr } from "@/lib/hr-auth";
import { siteOrigin } from "@/lib/origin";

export const metadata: Metadata = { title: "QR — Voxis", robots: { index: false, follow: false } };

// Made for a projector: the QR code as large as the screen allows, with the address written out underneath in case a
// phone camera cannot read it from the back of the room.
export default async function BigQrPage(props: PageProps<"/hr/qr/[id]">) {
  if (!(await isHr())) redirect("/hr/giris");
  const { id } = await props.params;
  const job = await getJob(id).catch(() => null);
  if (!job) notFound();

  const link = `${await siteOrigin()}/v/${job.slug}`;
  const qr = await QRCode.toString(link, { type: "svg", margin: 2, color: { dark: "#000000", light: "#ffffff" } });
  return (
    <main className="grid min-h-dvh place-items-center bg-white p-6 text-center text-black">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-semibold md:text-5xl">{job.title}{job.company ? ` · ${job.company}` : ""}</h1>
        {/* generated here from our own URL, never from user input, so inlining the SVG is safe */}
        <div className="aspect-square w-[min(68vh,88vw)] [&>svg]:size-full" role="img" aria-label="Müraciət üçün QR kod" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="text-2xl font-semibold tracking-tight md:text-4xl">{link.replace(/^https?:\/\//, "")}</p>
        <p className="text-xl text-neutral-600">Telefonla skan edin və səslə müraciət edin</p>
      </div>
    </main>
  );
}
