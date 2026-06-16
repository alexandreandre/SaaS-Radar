import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs).toISOString();

  // In-memory fast path (dev + single instance)
  const memKey = `${key}:${windowStart}`;
  const mem = memoryBuckets.get(memKey);
  if (mem && mem.resetAt > now) {
    if (mem.count >= max) {
      return { allowed: false, remaining: 0, resetAt: mem.resetAt };
    }
    mem.count += 1;
    return { allowed: true, remaining: max - mem.count, resetAt: mem.resetAt };
  }
  memoryBuckets.set(memKey, { count: 1, resetAt: now + windowMs });

  // Persisted fallback (multi-instance)
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("admin_rate_limits")
      .select("count")
      .eq("key", key)
      .eq("window_start", windowStart)
      .maybeSingle();

    const current = (data?.count as number | undefined) ?? 0;
    if (current >= max) {
      return { allowed: false, remaining: 0, resetAt: now + windowMs };
    }

    await admin.from("admin_rate_limits").upsert(
      { key, window_start: windowStart, count: current + 1 },
      { onConflict: "key,window_start" }
    );

    return { allowed: true, remaining: max - current - 1, resetAt: now + windowMs };
  } catch {
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }
}
