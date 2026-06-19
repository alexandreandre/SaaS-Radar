import { AdminAuditClient } from "@/components/admin/audit-client";
import { getAdminAuditLogs } from "@/lib/admin/audit-page";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function asString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function AdminAuditLoader({ searchParams }: { searchParams?: SearchParamsInput }) {
  const limit = Number.parseInt(asString(searchParams?.limit) ?? "50", 10);
  const offset = Number.parseInt(asString(searchParams?.offset) ?? "0", 10);
  const targetId = asString(searchParams?.target_id);

  let initialData = null;
  let initialError: string | null = null;

  try {
    initialData = await getAdminAuditLogs({ limit, offset, targetId });
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return <AdminAuditClient initialData={initialData} initialError={initialError} />;
}
