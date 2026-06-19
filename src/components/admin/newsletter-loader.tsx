import { AdminNewsletterClient } from "@/components/admin/newsletter-client";
import { getAdminNewsletterData } from "@/lib/admin/newsletter";

export async function AdminNewsletterLoader() {
  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getAdminNewsletterData();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <AdminNewsletterClient initialData={initialData} initialError={initialError} />;
}
