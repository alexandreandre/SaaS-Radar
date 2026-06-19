import { AdminSystemClient } from "@/components/admin/system-client";
import { getAdminSystemPageData } from "@/lib/admin/system";

export async function AdminSystemLoader() {
  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getAdminSystemPageData();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <AdminSystemClient initialData={initialData} initialError={initialError} />;
}
