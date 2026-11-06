// Small display helpers for the HR screens.

// "Aysel Məmmədova" -> "AM". Spec: candidates have no photo, only initials.
export function initials(name: string): string {
  const letters = name.trim().split(/\s+/).slice(0, 2).map((word) => [...word][0] ?? "");
  return letters.join("").toLocaleUpperCase("az") || "?";
}

// "indicə", "5 dəq əvvəl", "2 saat əvvəl", "3 gün əvvəl" (spec H-06: "2 saat əvvəl").
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "indicə";
  if (minutes < 60) return `${minutes} dəq əvvəl`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} saat əvvəl`;
  return `${Math.floor(minutes / (60 * 24))} gün əvvəl`;
}

export const BAND_TEXT = { high: "Yüksək", medium: "Orta", low: "Aşağı" } as const;
