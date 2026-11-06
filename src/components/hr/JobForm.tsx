"use client";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { defaultCriterionLabel, FIELD_CATALOG, LANGUAGE_OPTIONS, questionsForCriteria } from "@/lib/catalog";
import { CriteriaSchema, PROFILE_FIELDS, type Criterion, type ProfileField } from "@/lib/schema";

// Spec H-04, as one page: basic info, criteria with a priority each, and the questions candidates will be asked.
// Each criterion is built from a fixed menu of job-related facts (never free text), so code, not an LLM, can
// later decide whether a candidate meets it.

type Row = { key: number; field: ProfileField; months: string; days: string; langs: string[]; priority: number; label: string };

const newRow = (key: number, field: ProfileField): Row => ({ key, field, months: "6", days: "7", langs: ["ru"], priority: 3, label: "" });
const PRIORITY_HINT: Record<number, string> = { 1: "Arzuolunan", 2: "", 3: "Vacib", 4: "", 5: "Mütləq" };

function toCriterion(row: Row, index: number): Criterion {
  const base = { id: `c${index + 1}`, priority: row.priority };
  const label = (value?: number | string[]) => row.label.trim() || defaultCriterionLabel(row.field, value);
  switch (row.field) {
    case "experience_months": {
      const value = Number(row.months);
      return { ...base, label: label(value), field: row.field, op: "number_gte", value };
    }
    case "available_within_days": {
      const value = Number(row.days);
      return { ...base, label: label(value), field: row.field, op: "number_lte", value };
    }
    case "languages":
      return { ...base, label: label(row.langs), field: row.field, op: "in_list", value: row.langs };
    default:
      return { ...base, label: label(), field: row.field, op: "bool_true" };
  }
}

export function JobForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<Row[]>([newRow(1, "experience_months"), newRow(2, "can_work_shifts")]);
  const [questionTexts, setQuestionTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const used = new Set(rows.map((r) => r.field));
  const free = PROFILE_FIELDS.filter((f) => !used.has(f));
  const update = (key: number, patch: Partial<Row>) => setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // The questions follow from the criteria: change a criterion and the matching question appears or goes away.
  const criteria = rows.map(toCriterion);
  const questions = questionsForCriteria(criteria);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (title.trim().length < 2) return setError("Vəzifə adını yazın.");
    const parsed = CriteriaSchema.safeParse(criteria);
    if (!parsed.success) return setError("Meyarları yoxlayın: ədədlər müsbət olmalı, dil siyahısı boş olmamalıdır (2–6 meyar).");
    setBusy(true);
    const response = await fetch("/api/hr/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, company, location, description, criteria: parsed.data, questionTexts }),
    }).catch(() => null);
    if (!response?.ok) {
      setBusy(false);
      return setError(response?.status === 401 ? "Sessiya bitib. Yenidən daxil olun." : "Saxlamaq alınmadı. Yenidən cəhd edin.");
    }
    const { id } = (await response.json()) as { id: string };
    router.push(`/hr/vakansiyalar/${id}`);
  }

  const input = "min-h-11 w-full rounded-lg border border-border px-3 text-base outline-none focus:border-primary";
  const label = "flex flex-col gap-1.5 text-sm font-medium";

  return (
    <form onSubmit={submit} className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Əsas məlumat</h2>
        <label className={label}>Vəzifə adı *<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="Məsələn: Kassir" data-testid="H-04-title" className={input} /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={label}>Şirkət<input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={60} data-testid="H-04-company" className={input} /></label>
          <label className={label}>Filial / ünvan<input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} placeholder="Məsələn: Nəsimi filialı" data-testid="H-04-location" className={input} /></label>
        </div>
        <label className={label}>Qısa təsvir<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} rows={3} className="rounded-lg border border-border p-3 text-base outline-none focus:border-primary" /><span className="self-end text-xs font-normal text-muted">{description.length} / 300</span></label>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Meyarlar və prioritetlər</h2>
          <p className="mt-1 text-sm text-muted">Hər meyara 1–5 prioritet verin: 5 ən vacibdir. Namizədlər bu meyarlara görə qiymətləndirilir və hər bal izah olunur.</p>
        </div>

        {rows.map((row) => {
          const { kind } = FIELD_CATALOG[row.field];
          return (
            <div key={row.key} className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5" data-testid="H-04-criterion">
              <div className="flex items-start gap-3">
                <label className={`${label} flex-1`}>Nəyi yoxlayırıq
                  <select value={row.field} onChange={(e) => update(row.key, { field: e.target.value as ProfileField })} className={input}>
                    {[row.field, ...free].map((f) => <option key={f} value={f}>{FIELD_CATALOG[f].label}</option>)}
                  </select>
                </label>
                {rows.length > 2 && (
                  <button type="button" aria-label="Meyarı sil" onClick={() => setRows(rows.filter((r) => r.key !== row.key))} className="mt-7 grid size-11 place-items-center rounded-lg text-muted hover:bg-surface hover:text-danger" data-testid="H-04-B9">
                    <Trash2 aria-hidden className="size-5" />
                  </button>
                )}
              </div>

              {kind === "months" && <label className={label}>Ən azı neçə ay<input type="number" min={1} max={600} value={row.months} onChange={(e) => update(row.key, { months: e.target.value })} className={`${input} w-40`} /></label>}
              {kind === "days" && <label className={label}>Neçə gün ərzində başlaya bilməlidir (0 = dərhal)<input type="number" min={0} max={365} value={row.days} onChange={(e) => update(row.key, { days: e.target.value })} className={`${input} w-40`} /></label>}
              {kind === "languages" && (
                <div role="group" aria-label="Dillər" className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(({ code, label: text }) => {
                    const on = row.langs.includes(code);
                    return <button key={code} type="button" aria-pressed={on} onClick={() => update(row.key, { langs: on ? row.langs.filter((c) => c !== code) : [...row.langs, code] })} className={`min-h-10 rounded-full border px-4 text-sm ${on ? "border-primary bg-primary-light font-medium text-primary" : "border-border"}`}>{text}</button>;
                  })}
                  <span className="self-center text-xs text-muted">biri kifayətdir</span>
                </div>
              )}
              {kind === "yesno" && <p className="text-sm text-muted">Namizəd “bəli” deməlidir.</p>}

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Prioritet</span>
                <div role="group" aria-label="Prioritet" className="flex items-center gap-2" data-testid="H-04-B10">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button key={p} type="button" aria-pressed={row.priority === p} onClick={() => update(row.key, { priority: p })} className={`size-11 rounded-lg border text-base tabular-nums ${row.priority === p ? "border-primary bg-primary font-semibold text-white" : "border-border hover:bg-surface"}`}>{p}</button>
                  ))}
                  <span className="ml-2 text-sm text-muted">{PRIORITY_HINT[row.priority]}</span>
                </div>
              </div>

              <label className={label}>Siyahıda görünən ad (istəyə bağlı)
                <input value={row.label} onChange={(e) => update(row.key, { label: e.target.value })} maxLength={120} placeholder={toCriterion(row, 0).label} className={input} />
              </label>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-3">
          {rows.length < 6 && free[0] && (
            <button type="button" onClick={() => setRows([...rows, newRow(Math.max(...rows.map((r) => r.key)) + 1, free[0]!)])} data-testid="H-04-B8" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm hover:bg-surface">
              <Plus aria-hidden className="size-4" /> Meyar əlavə et
            </button>
          )}
          <p className="text-sm text-muted">Yaş, cins, görünüş, ailə vəziyyəti kimi meyarlar istifadə oluna bilməz.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Namizədə veriləcək suallar</h2>
          <p className="mt-1 text-sm text-muted">Sualları meyarlardan özümüz qururuq ki, heç bir meyar sualsız qalmasın. İstəsəniz sözləri dəyişin.</p>
        </div>
        {questions.map((q, i) => (
          <label key={q.id} className={label}>Sual {i + 1}
            <input value={questionTexts[q.id] ?? q.text} onChange={(e) => setQuestionTexts({ ...questionTexts, [q.id]: e.target.value })} maxLength={200} className={input} />
          </label>
        ))}
      </section>

      {error && <p role="alert" data-testid="H-04-error" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
      <div className="sticky bottom-0 -mx-1 flex justify-end border-t border-border bg-surface/95 px-1 py-4 backdrop-blur">
        <button type="submit" disabled={busy} data-testid="H-04-B6" className="min-h-12 rounded-lg bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover disabled:bg-border disabled:text-muted">
          {busy ? "Yaradılır…" : "Dərc et və QR yarat"}
        </button>
      </div>
    </form>
  );
}
