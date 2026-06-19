import { AdminCockpitClient } from "@/components/admin/cockpit-client";
import { getAdminCockpitData } from "@/lib/admin/cockpit";

export async function AdminCockpitLoader() {
  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getAdminCockpitData();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <AdminCockpitClient initialData={initialData} initialError={initialError} />;
}
