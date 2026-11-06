"use client";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationStatus } from "@/lib/db";
import { CopyButton } from "./ClientButtons";

// The ONLY place a candidate's fate changes, and it is always a human clicking (CLAUDE.md hard rule). The system
// ranks and explains; it never invites or rejects by itself. Messages are drafted for HR to copy: nothing is sent.

type Props = { applicationId: string; status: ApplicationStatus; name: string; company: string; jobTitle: string; location: string };
type Mode = "invite" | "reject" | null;

const REASONS = ["Tələblərə uyğun deyil", "Vakansiya dolub", "Namizədlə əlaqə alınmadı", "Digər"];

export function DecisionActions({ applicationId, status, name, company, jobTitle, location }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(""); // filled with tomorrow when the dialog opens (Date.now() must not run during render)
  const [time, setTime] = useState("10:00");
  const [place, setPlace] = useState(location);
  const [reason, setReason] = useState(REASONS[0]!);
  const firstName = name.trim().split(/\s+/)[0] ?? name;
  const who = company || "Şirkət";

  const inviteText = (d: string, t: string, p: string) => `Salam, ${firstName}! ${who} olaraq sizi ${d} saat ${t}-da ${p || "ofisimizdə"} ünvanında ${jobTitle} vəzifəsi üzrə müsahibəyə dəvət edirik. Zəhmət olmasa bu mesaja cavab yazaraq təsdiq edin.`;
  const invite = inviteText(date, time, place);
  const reject = `Salam, ${firstName}. ${who}-ə göstərdiyiniz maraq üçün təşəkkür edirik. Təəssüf ki, bu dəfə ${jobTitle} vəzifəsi üzrə müraciətinizlə davam edə bilmirik. Sizə uğurlar arzulayırıq.`;
  const [message, setMessage] = useState("");

  async function setStatus(next: ApplicationStatus) {
    setBusy(true);
    await fetch(`/api/hr/applications/${applicationId}/status`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    setMode(null);
    router.refresh();
  }

  const open = (next: Exclude<Mode, null>) => {
    if (next === "invite") {
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
      setDate(tomorrow);
      setMessage(inviteText(tomorrow, time, place));
    } else {
      setMessage(reject);
    }
    setMode(next);
  };
  const button = "min-h-11 rounded-lg px-4 text-sm font-medium disabled:opacity-50";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status !== "interview" && status !== "accepted" && <button type="button" onClick={() => open("invite")} disabled={busy} data-testid="H-07-B11" className={`${button} bg-primary text-ink hover:bg-primary-hover`}>Müsahibəyə dəvət et</button>}
        {status === "interview" && <button type="button" onClick={() => setStatus("accepted")} disabled={busy} className={`${button} bg-success text-ink`}>Qəbul et</button>}
        {status !== "rejected" && <button type="button" onClick={() => open("reject")} disabled={busy} data-testid="H-07-B12" className={`${button} border border-danger/40 text-danger hover:bg-danger/5`}>İmtina et</button>}
        {(status === "interview" || status === "accepted" || status === "rejected") && <button type="button" onClick={() => setStatus("viewed")} disabled={busy} data-testid="H-07-B14" className={`${button} text-muted hover:bg-surface`}>Qərarı geri al</button>}
      </div>

      {mode && (
        <div role="dialog" aria-modal="true" aria-label={mode === "invite" ? "Müsahibəyə dəvət" : "İmtina"} className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onKeyDown={(e) => e.key === "Escape" && setMode(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{mode === "invite" ? `${name} müsahibəyə dəvət` : `${name} üçün imtina`}</h2>
              <button type="button" onClick={() => setMode(null)} aria-label="Bağla" className="grid size-9 place-items-center rounded-lg hover:bg-surface"><X aria-hidden className="size-5" /></button>
            </div>

            {mode === "invite" ? (
              <div className="mb-4 grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-sm font-medium">Tarix<input type="date" value={date} onChange={(e) => { setDate(e.target.value); }} className="min-h-10 rounded-lg border border-border px-2" /></label>
                <label className="flex flex-col gap-1 text-sm font-medium">Saat<input type="time" value={time} step={900} onChange={(e) => setTime(e.target.value)} className="min-h-10 rounded-lg border border-border px-2" /></label>
                <label className="flex flex-col gap-1 text-sm font-medium">Yer<input value={place} onChange={(e) => setPlace(e.target.value)} className="min-h-10 rounded-lg border border-border px-2" /></label>
              </div>
            ) : (
              <label className="mb-4 flex flex-col gap-1 text-sm font-medium">Səbəb (daxili, namizəd görmür)
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-10 rounded-lg border border-border px-2">{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
              </label>
            )}

            {mode === "invite" && (
              <button type="button" onClick={() => setMessage(invite)} className="mb-2 text-sm text-primary">Mesajı tarix, saat və yerə görə yenilə</button>
            )}
            <label className="flex flex-col gap-1 text-sm font-medium">Mesaj (redaktə edə bilərsiniz)
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="rounded-lg border border-border p-3 text-base font-normal" />
            </label>
            <p className="mt-2 text-xs text-muted">{mode === "reject" ? "Qərarı sonra geri ala bilərsiniz. " : ""}Mesaj göndərilmir: kopyalayıb özünüz göndərin. Düymə yalnız statusu dəyişir.</p>

            <div className="mt-5 flex justify-end gap-2">
              <CopyButton text={message} label="Mesajı kopyala" />
              <button type="button" onClick={() => setMode(null)} className={`${button} text-muted hover:bg-surface`}>Ləğv et</button>
              <button type="button" disabled={busy} onClick={() => setStatus(mode === "invite" ? "interview" : "rejected")} data-testid={mode === "invite" ? "H-08-B1" : "H-09-B1"} className={`${button} ${mode === "invite" ? "bg-primary text-ink" : "bg-danger text-ink"}`}>
                {mode === "invite" ? "Statusu dəyiş" : "İmtina et"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
