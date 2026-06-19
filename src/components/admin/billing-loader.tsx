import { AdminBillingClient } from "@/components/admin/billing-client";
import { getAdminBillingData } from "@/lib/admin/billing";

export async function AdminBillingLoader() {
  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getAdminBillingData();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <AdminBillingClient initialData={initialData} initialError={initialError} />;
}
