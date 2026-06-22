import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const ADMIN_GATE_COOKIE = "admin_gate";
/** 12 h — renouveler en resaisissant le token d'accès. */
export const ADMIN_GATE_COOKIE_MAX_AGE = 60 * 60 * 12;

const GATE_VERSION = "v1";

export function getAdminAccessToken(): string | undefined {
  const token = process.env.ADMIN_ACCESS_TOKEN?.trim();
  return token || undefined;
}

export function isAdminAccessTokenConfigured(): boolean {
  return !!getAdminAccessToken();
}

export function verifyAdminAccessToken(provided: string | null | undefined): boolean {
  const expected = getAdminAccessToken();
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function createAdminGateCookieValue(): string {
  const secret = getAdminAccessToken();
  if (!secret) throw new Error("ADMIN_ACCESS_TOKEN not configured");
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = Date.now().toString(36);
  const payload = `${GATE_VERSION}.${issuedAt}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminGateCookieValue(value: string | null | undefined): boolean {
  const secret = getAdminAccessToken();
  if (!secret || !value) return false;

  const parts = value.split(".");
  if (parts.length !== 4) return false;
  const [version, issuedAt, nonce, sig] = parts;
  if (version !== GATE_VERSION || !issuedAt || !nonce || !sig) return false;

  const payload = `${version}.${issuedAt}.${nonce}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }

  const issuedMs = parseInt(issuedAt, 36);
  if (!Number.isFinite(issuedMs)) return false;
  return Date.now() - issuedMs <= ADMIN_GATE_COOKIE_MAX_AGE * 1000;
}

export function isAdminAccessPage(pathname: string): boolean {
  return pathname === "/admin/access";
}

export function isAdminGateApiPath(pathname: string): boolean {
  return pathname === "/api/admin/auth/gate";
}

/** Routes /admin/* soumises au token d'accès (sauf la page de saisie). */
export function requiresAdminAccessToken(pathname: string): boolean {
  if (!pathname.startsWith("/admin")) return false;
  if (isAdminAccessPage(pathname)) return false;
  return true;
}

export function hasAdminGateFromRequest(request: Request): boolean {
  if (!isAdminAccessTokenConfigured()) return true;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const gateCookie = parseCookieValue(cookieHeader, ADMIN_GATE_COOKIE);
  if (verifyAdminGateCookieValue(gateCookie)) return true;

  return verifyAdminAccessToken(request.headers.get("x-admin-access-token"));
}

function parseCookieValue(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return null;
}

export function adminGateCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict" as const,
    path: "/",
    maxAge: ADMIN_GATE_COOKIE_MAX_AGE,
  };
}
