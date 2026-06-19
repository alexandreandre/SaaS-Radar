import { SourcingConsole } from "@/components/admin/sourcing-console";
import { getAdminSourcingConsoleData } from "@/lib/admin/sourcing-page";

export async function SourcingLoader() {
  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getAdminSourcingConsoleData();
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <SourcingConsole initialData={initialData} initialError={initialError} />;
}
