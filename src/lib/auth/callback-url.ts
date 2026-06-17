/** N'autorise qu'un chemin interne (évite open-redirect). */
export function sanitizeAuthNext(raw: string | null | undefined, fallback = "/mes-saas"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

export function sanitizeAdminNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) return "/admin";
  if (raw.startsWith("/admin/login")) return "/admin";
  return raw;
}

/** URL absolue du callback Supabase Auth, avec propagation de `next`. */
export function buildAuthCallbackUrl(origin: string, next: string): string {
  const base = origin.replace(/\/$/, "");
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const qs = params.toString();
  return `${base}/auth/callback${qs ? `?${qs}` : ""}`;
}
