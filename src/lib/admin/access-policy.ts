/** Message générique — ne révèle pas si le token est invalide. */
export const ADMIN_ACCESS_GENERIC_ERROR = "Accès refusé.";

export const ADMIN_LOGIN_GENERIC_ERROR =
  "Identifiants invalides ou accès non autorisé.";

export function getAdminLoginRateLimit() {
  return { max: 5, windowSeconds: 900 };
}

export function getAdminGateRateLimit() {
  return { max: 5, windowSeconds: 900 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
