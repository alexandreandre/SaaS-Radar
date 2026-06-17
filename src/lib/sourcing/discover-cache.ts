import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/env";
import type { FactualLead } from "./schema";
import { factualLeadSchema } from "./schema";
import { createHash } from "crypto";

function createAdminClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const TTL_MS = 24 * 60 * 60 * 1000;

function buildCacheKey(countryCode: string, sector: string | undefined, exclusions: string[]): string {
  const hash = createHash("sha256")
    .update(`${countryCode}|${sector ?? ""}|${exclusions.slice(0, 50).join(";")}`)
    .digest("hex")
    .slice(0, 16);
  return `${countryCode}:${sector ?? "all"}:${hash}`;
}

export async function getCachedLeads(
  countryCode: string,
  sector: string | undefined,
  exclusions: string[]
): Promise<FactualLead[] | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const cacheKey = buildCacheKey(countryCode, sector, exclusions);
  const { data } = await admin
    .from("sourcing_discover_cache")
    .select("leads, expires_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;

  const raw = data.leads as unknown[];
  const valid: FactualLead[] = [];
  for (const item of raw) {
    const parsed = factualLeadSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid.length > 0 ? valid : null;
}

export async function setCachedLeads(
  countryCode: string,
  sector: string | undefined,
  exclusions: string[],
  leads: FactualLead[]
): Promise<void> {
  const admin = createAdminClient();
  if (!admin || leads.length === 0) return;

  const cacheKey = buildCacheKey(countryCode, sector, exclusions);
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  await admin.from("sourcing_discover_cache").upsert(
    {
      cache_key: cacheKey,
      country_code: countryCode,
      sector: sector ?? null,
      leads: leads as unknown as Record<string, unknown>[],
      expires_at: expiresAt,
    },
    { onConflict: "cache_key" }
  );
}
