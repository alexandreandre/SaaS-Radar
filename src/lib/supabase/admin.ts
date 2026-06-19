import "server-only";
import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

function adminClientOptions(): SupabaseClientOptions<"public"> | undefined {
  if (typeof globalThis.WebSocket !== "undefined") return undefined;

  try {
    // Node < 22 : realtime-js exige un transport WebSocket explicite (cron CLI, workers).
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const ws = require("ws") as any;
    return { realtime: { transport: ws } };
  } catch {
    return undefined;
  }
}

// Client service-role non type (comme les autres clients du projet) : le type
// Database ecrit a la main ne satisfait pas le GenericSchema de supabase-js et
// ferait retomber les writes sur `never`. Les payloads sont valides cote appelant.
export function createAdminClient() {
  return createClient(
    getSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    adminClientOptions(),
  );
}
