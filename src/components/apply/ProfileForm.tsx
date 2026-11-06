"use client";
import { FIELD_CATALOG, LANGUAGE_OPTIONS } from "@/lib/catalog";
import type { Profile, ProfileField } from "@/lib/schema";
import { Segmented } from "./ui";

// Spec C-07, "Sizi belə başa düşdük": the candidate sees what the AI understood, with their own words as proof, and
// can fix anything. Only the facts this job actually scores are shown (everything scored must be confirmed).

const YES_NO = [
  { value: true, text: "Bəli" },
  { value: false, text: "Xeyr" },
  { value: null, text: "Demədim" },
];
const START_OPTIONS = [
  { value: 0, text: "Dərhal" },
  { value: 7, text: "1 həftə" },
  { value: 14, text: "2 həftə" },
  { value: 30, text: "1 ay" },
];

type Props = {
  fields: ProfileField[];
  profile: Profile; // what the candidate is editing right now
  original: Profile; // what the AI extracted (for the quotes)
  onChange: (profile: Profile) => void;
};

export function ProfileForm({ fields, profile, original, onChange }: Props) {
  const set = <K extends ProfileField>(field: K, value: Profile[K]) => onChange({ ...profile, [field]: value });

  return (
    <div className="flex flex-col gap-6">
      {fields.map((field) => {
        const { label, kind } = FIELD_CATALOG[field];
        const quote = original.evidence[field];
        const missing = original[field] === null;
        return (
          <fieldset key={field} className="flex flex-col gap-2" data-testid={`C-07-field-${field}`}>
            <legend className="mb-1 text-base font-medium">{label}</legend>

            {kind === "months" && (
              <label className="flex items-center gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={600}
                  value={profile.experience_months ?? ""}
                  placeholder="Demədiniz"
                  onChange={(e) => set("experience_months", e.target.value === "" ? null : Math.max(0, Math.min(600, Math.round(Number(e.target.value)))))}
                  className="min-h-12 w-32 rounded-lg border border-border px-3 text-base"
                />
                <span className="text-muted">ay</span>
              </label>
            )}

            {kind === "yesno" && (
              <Segmented
                label={label}
                value={profile[field as "can_work_shifts" | "can_work_weekends" | "has_driving_license"]}
                options={YES_NO}
                onChange={(v) => set(field as "can_work_shifts", v)}
              />
            )}

            {kind === "languages" && (
              <div role="group" aria-label={label} className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(({ code, label: text }) => {
                  const selected = profile.languages?.includes(code) ?? false;
                  return (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        const next = selected ? (profile.languages ?? []).filter((c) => c !== code) : [...(profile.languages ?? []), code];
                        set("languages", next.length ? next : null); // never an empty list: null = "did not say"
                      }}
                      className={`min-h-12 rounded-full border px-4 text-base ${selected ? "border-primary bg-primary-light font-medium text-primary" : "border-border"}`}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            )}

            {kind === "days" && (
              <Segmented
                label={label}
                value={profile.available_within_days}
                options={[
                  ...START_OPTIONS,
                  // keep an unusual value the AI found (e.g. 3 gün) selectable instead of silently losing it
                  ...(original.available_within_days !== null && !START_OPTIONS.some((o) => o.value === original.available_within_days)
                    ? [{ value: original.available_within_days, text: `${original.available_within_days} gün` }]
                    : []),
                  { value: null as number | null, text: "Demədim" },
                ]}
                onChange={(v) => set("available_within_days", v)}
              />
            )}

            {quote ? (
              <p className="text-sm text-muted">Siz dediniz: “{quote}”</p>
            ) : (
              missing && <p className="text-sm text-warning">Bu barədə eşitmədik. İstəyirsinizsə, əlavə edin.</p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
