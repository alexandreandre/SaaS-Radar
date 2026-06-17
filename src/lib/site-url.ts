/**
 * Origine publique de l'app (sans slash final).
 * Priorité : NEXT_PUBLIC_SITE_URL (prod) → en-têtes de requête (SSR/API) → window (client).
 */
export function getSiteOriginFromEnv(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

/** Origine côté serveur (route API, Server Actions). */
export function getRequestOrigin(request: Request): string {
  const fromEnv = getSiteOriginFromEnv();
  if (fromEnv) return fromEnv;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const proto = forwardedProto?.split(",")[0]?.trim() || "https";
    return `${proto}://${forwardedHost.split(",")[0]?.trim()}`;
  }

  const host = request.headers.get("host");
  if (host) {
    const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

/** Origine côté client (login, OAuth). */
export function getClientSiteOrigin(): string {
  const fromEnv = getSiteOriginFromEnv();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
