import { AdminUsersClient } from "@/components/admin/users-client";
import { getAdminUsersList, getAdminUserStats } from "@/lib/admin/users";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function asString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export async function AdminUsersLoader({ searchParams }: { searchParams?: SearchParamsInput }) {
  const q = asString(searchParams?.q) ?? "";
  const plan = asString(searchParams?.plan);
  const adminRole = asString(searchParams?.admin_role);
  const subscriptionStatus = asString(searchParams?.subscription_status);
  const offset = Math.max(Number.parseInt(asString(searchParams?.offset) ?? "0", 10), 0);
  const limit = 50;

  let initialData = null;
  let initialStats = null;
  let initialError: string | null = null;

  try {
    const [list, stats] = await Promise.all([
      getAdminUsersList({ q, plan, adminRole, subscriptionStatus, offset, limit }),
      getAdminUserStats(),
    ]);
    initialData = list;
    initialStats = stats;
  } catch (err) {
    initialError = err instanceof Error ? err.message : String(err);
  }

  return (
    <AdminUsersClient
      initialData={initialData}
      initialStats={initialStats}
      initialError={initialError}
    />
  );
}
