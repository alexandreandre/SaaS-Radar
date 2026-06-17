import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

// Client service-role non type (comme les autres clients du projet) : le type
// Database ecrit a la main ne satisfait pas le GenericSchema de supabase-js et
// ferait retomber les writes sur `never`. Les payloads sont valides cote appelant.
export function createAdminClient() {
  return createClient(
    getSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
