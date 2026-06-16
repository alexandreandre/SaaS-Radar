import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client service-role non type (comme les autres clients du projet) : le type
// Database ecrit a la main ne satisfait pas le GenericSchema de supabase-js et
// ferait retomber les writes sur `never`. Les payloads sont valides cote appelant.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
