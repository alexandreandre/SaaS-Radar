import "server-only";

const sessionCounts = new Map<string, { count: number; resetAt: number }>();

const SESSION_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function checkIdeaSessionRateLimit(key: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const entry = sessionCounts.get(key);

  if (!entry || now > entry.resetAt) {
    sessionCounts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= SESSION_LIMIT) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}
