// Where to send someone after they log in. Only paths inside /hr are accepted: a "next" value supplied in a link must
// never be able to bounce a freshly logged-in person to another website (an "open redirect").
export function safeNext(value: unknown, fallback = "/hr/vakansiyalar"): string {
  if (typeof value !== "string" || !value.startsWith("/hr")) return fallback;
  const after = value[3]; // "/hr", "/hr/...", "/hr?..." are fine; "/hrx" is not
  if (after !== undefined && after !== "/" && after !== "?") return fallback;
  if (value.includes("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
