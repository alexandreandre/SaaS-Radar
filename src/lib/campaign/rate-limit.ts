import "server-only";

const userCounts = new Map<string, { count: number; resetAt: number }>();

const DAILY_LIMIT = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function checkCampaignRateLimit(
  userId: string,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const entry = userCounts.get(userId);

  if (!entry || now > entry.resetAt) {
    userCounts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}
