import { getAdminRole } from "@/lib/auth";
import { AdminUsersClient } from "@/components/admin/users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentRole = await getAdminRole();
  return <AdminUsersClient currentRole={currentRole} />;
}
