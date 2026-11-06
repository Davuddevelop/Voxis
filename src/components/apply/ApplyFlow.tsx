"use client";
import { AlertCircle, ArrowLeft, BadgeCheck, CheckCircle2, Clock, FileX2, MapPin, Mic, MicOff, ShieldCheck, Square } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { normalizePhone } from "@/lib/apply";
import type { JobQuestion } from "@/lib/catalog";
import type { Profile, ProfileField } from "@/lib/schema";
import { formatClock } from "./audio";
import { ProfileForm } from "./ProfileForm";
import { Button, Spinner } from "./ui";
import { MAX_SECONDS, recordingSupported, useRecorder } from "./useRecorder";

// The whole candidate journey (spec C-01 ... C-08) as one state machine on one page. Answers live in memory here,
// so pressing "back" or reloading a step can never silently lose a recorded answer.

export type PublicJob = {
  slug: string;
  title: string;
  company: string;
  location: string;
  description: string;
  questions: JobQuestion[];
  fields: ProfileField[]; // which facts this job scores: the confirm screen shows exactly these
};

type Step = "intro" | "consent" | "mic" | "questions" | "processing" | "confirm" | "done";
type Extraction = { profile: Profile; answers: { questionId: string; transcript: string }[]; token: string };

const SAFETY = "Müraciət pulsuzdur. İş üçün heç kim sizdən pul tələb edə bilməz.";

function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-6 py-6">{children}</div>
      {footer && <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
    </>
  );
}

const Bullet = ({ icon: Icon, children }: { icon: typeof Mic; children: ReactNode }) => (
  <li className="flex items-center gap-3 text-base">
    <Icon aria-hidden className="size-6 shrink-0 text-primary" />
    <span>{children}</span>
  </li>
);

const Alert = ({ children, testId }: { children: ReactNode; testId?: string }) => (
  <p role="alert" data-testid={testId} className="flex gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
    <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
    {children}
  </p>
);

export function ApplyFlow({ job }: { job: PublicJob }) {
  const [step, setStep] = useState<Step>("intro");
  const [consentAt, setConsentAt] = useState<string | null>(null);
  const [typedMode, setTypedMode] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [longText, setLongText] = useState(false);
  // State, not a ref: the question screens need the stream while rendering.
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopStream = (s: MediaStream | null) => s?.getTracks().forEach((track) => track.stop());
  const releaseMic = () => (stopStream(stream), setStream(null));
  // Runs when the stream is replaced and when the page is left, so the microphone can never stay on by accident.
  useEffect(() => () => stopStream(stream), [stream]);

  const total = job.questions.length;
  const progress = { intro: 0, consent: 0.1, mic: 0.2, questions: 0.2 + 0.5 * (index / total), processing: 0.78, confirm: 0.9, done: 1 }[step];
  const phone = normalizePhone(`+994${phoneDigits}`);

  async function allowMic() {
    setMicDenied(false);
    if (!recordingSupported()) return setTypedMode(true), setStep("questions");
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }));
      setStep("questions");
    } catch {
      setMicDenied(true);
    }
  }

  async function transcribe(wav: Blob): Promise<string> {
    const form = new FormData();
    form.set("slug", job.slug);
    form.set("audio", wav, "answer.wav");
    const response = await fetch("/api/apply/transcribe", { method: "POST", body: form });
    if (!response.ok) throw new Error(`transcribe ${response.status}`);
    return ((await response.json()) as { transcript: string }).transcript;
  }

  async function runExtraction(all: Record<string, string>) {
    setStep("processing");
    setExtractionFailed(false);
    try {
      const response = await fetch("/api/apply/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: job.slug, answers: job.questions.map((q) => ({ questionId: q.id, transcript: all[q.id] ?? "" })) }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const result = (await response.json()) as Extraction;
      setExtraction(result);
      setProfile(result.profile);
      setStep("confirm");
    } catch {
      setExtractionFailed(true);
    }
  }

  function onAnswered(question: JobQuestion, transcript: string) {
    const next = { ...answers, [question.id]: transcript };
    setAnswers(next);
    if (index + 1 < total) return setIndex(index + 1);
    releaseMic();
    void runExtraction(next);
  }

  async function submit() {
    if (!extraction || !profile || !phone || !consentAt) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const response = await fetch("/api/apply/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: job.slug, consentAt, name, phone, answers: extraction.answers, extractedProfile: extraction.profile, profile, token: extraction.token }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStep("done");
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    if (!window.confirm("Bütün cavablar silinəcək. Yenidən yazmaq istəyirsiniz?")) return;
    setAnswers({});
    setExtraction(null);
    setProfile(null);
    setIndex(0);
    if (!typedMode) setStep("mic");
    else setStep("questions");
  }

  const back = step === "consent" ? () => setStep("intro") : step === "mic" ? () => setStep("consent") : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-5 text-text">
      <header className="sticky top-0 z-10 -mx-5 bg-background/95 px-5 pt-3 backdrop-blur">
        <div className="flex h-12 items-center justify-between">
          {back ? (
            <button type="button" onClick={back} aria-label="Geri" data-testid="S-01-B1" className="-ml-3 grid size-12 place-items-center rounded-lg hover:bg-surface">
              <ArrowLeft aria-hidden className="size-6" />
            </button>
          ) : (
            <span className="size-12" />
          )}
          <span className="truncate text-sm text-muted">{job.company || "Voxis"}</span>
          <span className="size-12" />
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      {step === "intro" && (
        <Screen footer={<Button onClick={() => setStep("consent")} data-testid="C-01-B1">Səslə müraciət et</Button>}>
          <div className="flex flex-col gap-2">
            {job.company && <p className="text-sm text-muted">{job.company}</p>}
            <h1 className="text-[1.75rem] font-semibold leading-tight">{job.title}</h1>
            {job.location && (
              <p className="mt-1 flex items-center gap-2 text-base text-muted">
                <MapPin aria-hidden className="size-5" />
                {job.location}
              </p>
            )}
            {job.description && (
              <>
                <p className={`mt-2 text-base ${longText ? "" : "line-clamp-3"}`}>{job.description}</p>
                {job.description.length > 120 && (
                  <button type="button" onClick={() => setLongText(!longText)} data-testid="C-01-B2" className="self-start text-primary">
                    {longText ? "Qısalt" : "Ətraflı"}
                  </button>
                )}
              </>
            )}
          </div>
          <div className="rounded-xl bg-surface p-5">
            <h2 className="mb-4 text-lg font-semibold">Necə müraciət edirəm?</h2>
            <ul className="flex flex-col gap-4">
              <Bullet icon={FileX2}>CV lazım deyil</Bullet>
              <Bullet icon={Mic}>{total} suala səslə cavab</Bullet>
              <Bullet icon={Clock}>Təxminən 2 dəqiqə</Bullet>
            </ul>
          </div>
          <p className="flex gap-2 text-sm text-muted">
            <ShieldCheck aria-hidden className="size-5 shrink-0 text-primary" />
            {SAFETY}
          </p>
        </Screen>
      )}

      {step === "consent" && (
        <Screen
          footer={
            <Button disabled={!consentAt} onClick={() => setStep("mic")} data-testid="C-02-B2">
              Davam et
            </Button>
          }
        >
          <h1 className="text-2xl font-semibold">Başlamazdan əvvəl</h1>
          <ul className="flex flex-col gap-4">
            <Bullet icon={Mic}>Cavablarınızı səs kimi yazıb mətnə çeviririk</Bullet>
            <Bullet icon={ShieldCheck}>Səsiniz mətnə çevrilmək üçün süni intellekt xidmətinə (Google Gemini) göndərilir. Müraciətinizi yalnız {job.company || "işəgötürən"} görür</Bullet>
            <Bullet icon={BadgeCheck}>Qərarı insan verir. Süni intellekt yalnız kömək edir</Bullet>
          </ul>
          <label className="flex min-h-12 items-start gap-3 rounded-xl border border-border p-4">
            <input
              type="checkbox"
              checked={!!consentAt}
              onChange={(e) => setConsentAt(e.target.checked ? new Date().toISOString() : null)}
              data-testid="C-02-B1"
              className="mt-0.5 size-6 shrink-0 accent-primary"
            />
            <span className="text-base">Səsimin və məlumatlarımın bu müraciət üçün emal olunmasına razıyam</span>
          </label>
        </Screen>
      )}

      {step === "mic" && (
        <Screen
          footer={
            <div className="flex flex-col gap-2">
              <Button onClick={allowMic} data-testid={micDenied ? "C-03-B2" : "C-03-B1"}>{micDenied ? "Yenidən yoxla" : "Mikrofonu aç"}</Button>
              {micDenied && (
                <Button variant="text" onClick={() => (setTypedMode(true), setStep("questions"))} data-testid="C-03-B3">
                  Yazılı cavab verin
                </Button>
              )}
            </div>
          }
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            {micDenied ? <MicOff aria-hidden className="size-20 text-danger" /> : <Mic aria-hidden className="size-20 text-primary" />}
            <h1 className="text-2xl font-semibold">{micDenied ? "Mikrofon bağlıdır" : "Mikrofona icazə verin"}</h1>
            {micDenied ? (
              <p className="text-base text-muted">
                iPhone: Ayarlar → Safari → Mikrofon.
                <br />
                Android: ünvan sətrindəki kilid ikonu → İcazələr → Mikrofon.
              </p>
            ) : (
              <p className="text-base text-muted">Növbəti pəncərədə “İcazə ver” düyməsini basın. Səsiniz yalnız siz yazmağa başlayanda qeyd olunur.</p>
            )}
          </div>
        </Screen>
      )}

      {step === "questions" && job.questions[index] && (
        <QuestionStep
          key={job.questions[index].id}
          question={job.questions[index]}
          index={index}
          total={total}
          stream={stream}
          typedMode={typedMode}
          transcribe={transcribe}
          onAnswered={(text) => onAnswered(job.questions[index]!, text)}
        />
      )}

      {step === "processing" && (
        <Screen footer={extractionFailed ? <Button onClick={() => runExtraction(answers)} data-testid="C-06-B1">Yenidən cəhd et</Button> : undefined}>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            {extractionFailed ? (
              <>
                <AlertCircle aria-hidden className="size-16 text-danger" />
                <h1 className="text-2xl font-semibold">Cavablarınızı emal edə bilmədik</h1>
                <p className="text-muted">İnternet bağlantınızı yoxlayıb yenidən cəhd edin.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-semibold">Cavablarınız emal olunur</h1>
                <Spinner label="Bir neçə saniyə çəkə bilər. Səhifəni bağlamayın." />
              </>
            )}
          </div>
        </Screen>
      )}

      {step === "confirm" && profile && extraction && (
        <Screen
          footer={
            <div className="flex flex-col gap-2">
              {submitError && <Alert testId="C-07-error">Göndərmək alınmadı. Yenidən cəhd edin.</Alert>}
              <Button loading={submitting} disabled={name.trim().length < 2 || !phone} onClick={submit} data-testid="C-07-B5">
                Təsdiqlə və göndər
              </Button>
            </div>
          }
        >
          <div>
            <h1 className="text-2xl font-semibold">Sizi belə başa düşdük</h1>
            <p className="mt-1 text-base text-muted">Yoxlayın və lazım olsa düzəldin. HR məlumatı görəcək.</p>
          </div>
          <ProfileForm fields={job.fields} profile={profile} original={extraction.profile} onChange={setProfile} />
          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <label className="flex flex-col gap-2">
              <span className="text-base font-medium">Ad və soyad</span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} data-testid="C-07-name" className="min-h-12 rounded-lg border border-border px-3 text-base" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-base font-medium">Telefon nömrəsi</span>
              <span className="flex min-h-12 items-center rounded-lg border border-border focus-within:border-primary">
                <span className="pl-3 pr-2 text-base text-muted">+994</span>
                <input
                  value={formatPhone(phoneDigits)}
                  onChange={(e) => setPhoneDigits(cleanDigits(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="50 123 45 67"
                  data-testid="C-07-phone"
                  className="min-h-12 flex-1 rounded-lg bg-transparent pr-3 text-base outline-none"
                />
              </span>
              {phoneDigits && !phone ? <span className="text-sm text-danger">Nömrəni düzgün yazın, məsələn 50 123 45 67</span> : <span className="text-sm text-muted">HR sizinlə bu nömrə ilə əlaqə saxlayacaq.</span>}
            </label>
          </div>
          <Button variant="text" onClick={startOver} data-testid="C-07-B6">Cavabları yenidən yaz</Button>
        </Screen>
      )}

      {step === "done" && (
        <Screen>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <CheckCircle2 aria-hidden className="size-20 text-success" />
            <h1 className="text-2xl font-semibold" data-testid="C-08-title">Müraciətiniz qəbul olundu</h1>
            <p className="text-base">
              {job.company || "İşəgötürən"} müraciətinizə baxacaq və sizinlə +994 {formatPhone(phoneDigits)} nömrəsi ilə əlaqə saxlayacaq.
            </p>
          </div>
          <div className="rounded-xl bg-surface p-5">
            <h2 className="mb-3 text-lg font-semibold">Növbəti addımlar</h2>
            <ol className="list-decimal space-y-2 pl-5 text-base">
              <li>HR cavablarınıza baxır</li>
              <li>Uyğun olsanız, zəng və ya mesaj alacaqsınız</li>
              <li>Müsahibə</li>
            </ol>
          </div>
          <p className="text-sm text-muted">{SAFETY}</p>
        </Screen>
      )}
    </div>
  );
}

const cleanDigits = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return (digits.startsWith("994") ? digits.slice(3) : digits.startsWith("0") ? digits.slice(1) : digits).slice(0, 9);
};
const formatPhone = (digits: string) => [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ");

type QuestionStepProps = {
  question: JobQuestion;
  index: number;
  total: number;
  stream: MediaStream | null;
  typedMode: boolean;
  transcribe: (wav: Blob) => Promise<string>;
  onAnswered: (transcript: string) => void;
};

// One question (spec C-04, plus the typed alternative C-05). Owns its own recorder, so it starts fresh per question.
function QuestionStep({ question, index, total, stream, typedMode, transcribe, onAnswered }: QuestionStepProps) {
  const recorder = useRecorder();
  const [typing, setTyping] = useState(typedMode || !stream);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [heardNothing, setHeardNothing] = useState(false);
  const last = index + 1 === total;
  const { recording } = recorder;
  const heard = recording && !recording.quiet;
  const canSend = typing ? text.trim().length >= 2 : !!heard;
  const warn = recorder.phase === "recording" && recorder.seconds >= MAX_SECONDS - 10; // last 10 seconds turn amber

  async function send() {
    setSending(true);
    setSendError(false);
    try {
      const transcript = typing ? text.trim() : await transcribe(recording!.wav);
      if (transcript.length < 2) {
        setHeardNothing(true);
        recorder.reset();
        return;
      }
      onAnswered(transcript);
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  }

  const problem =
    recorder.error === "too_short" ? "Çox qısa cavab. Ən azı 2 saniyə danışın." :
    recorder.error === "convert_failed" ? "Səs emal olunmadı. Yenidən cəhd edin." :
    heardNothing || recording?.quiet ? "Səsinizi eşitmədik. Yenidən cəhd edin." : null;

  return (
    <Screen
      footer={
        <div className="flex flex-col gap-2">
          {sendError && <Alert testId="C-04-error">Göndərmək alınmadı. İnternet bağlantınızı yoxlayın.</Alert>}
          <Button loading={sending} disabled={!canSend} onClick={send} data-testid={sendError ? "C-04-B8" : "C-04-B5"}>
            {sendError ? "Yenidən cəhd et" : last ? "Bitir" : "Növbəti"}
          </Button>
        </div>
      }
    >
      <p className="text-sm font-medium text-muted" data-testid="C-04-step">Sual {index + 1} / {total}</p>
      <div className="rounded-xl bg-surface p-5">
        <h1 className="text-xl font-medium leading-7" data-testid="C-04-question">{question.text}</h1>
        <p className="mt-2 text-base text-muted">{question.hint}</p>
      </div>

      {typing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="typed-answer" className="sr-only">Cavabınız</label>
          <textarea id="typed-answer" value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} rows={6} data-testid="C-05-text" placeholder="Cavabınızı yazın" className="rounded-lg border border-border p-3 text-base" />
          <p className="text-right text-sm text-muted">{text.length} / 500</p>
          {stream && <Button variant="text" onClick={() => setTyping(false)} data-testid="C-05-B2">Səslə cavab verin</Button>}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          {recorder.phase === "ready" && recording ? (
            <div className="flex w-full flex-col items-center gap-4">
              <audio controls src={recording.url} className="w-full" data-testid="C-04-B3" />
              <Button variant="secondary" onClick={() => (setHeardNothing(false), recorder.reset())} data-testid="C-04-B4">Yenidən yaz</Button>
            </div>
          ) : recorder.phase === "converting" ? (
            <Spinner label="Hazırlanır…" />
          ) : (
            <>
              <div aria-hidden className="flex h-10 items-center gap-0.5">
                {recorder.levels.map((level, i) => (
                  <span key={i} style={{ height: `${Math.max(4, level * 40)}px` }} className="w-1 rounded-full bg-primary/70 transition-[height]" />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (recorder.phase === "recording") return recorder.stop();
                  setHeardNothing(false);
                  if (stream) recorder.start(stream);
                }}
                aria-label={recorder.phase === "recording" ? "Dayandır" : "Yazmağa başla"}
                data-testid={recorder.phase === "recording" ? "C-04-B2" : "C-04-B1"}
                className={`grid size-24 place-items-center rounded-full text-white transition-colors ${recorder.phase === "recording" ? "animate-pulse bg-danger" : "bg-primary hover:bg-primary-hover"}`}
              >
                {recorder.phase === "recording" ? <Square aria-hidden className="size-9 fill-white" /> : <Mic aria-hidden className="size-10" />}
              </button>
              <p className={`text-lg tabular-nums ${warn ? "font-medium text-warning" : "text-muted"}`} data-testid="C-04-timer">
                {formatClock(recorder.seconds)} / {formatClock(MAX_SECONDS)}
              </p>
              {recorder.phase === "idle" && <p className="text-sm text-muted">Yazmağa başlamaq üçün basın</p>}
            </>
          )}
          {problem && <Alert testId="C-04-problem">{problem}</Alert>}
          <Button variant="text" className="w-auto" onClick={() => setTyping(true)} data-testid="C-04-B6">Yazılı cavab verin</Button>
        </div>
      )}
    </Screen>
  );
}
