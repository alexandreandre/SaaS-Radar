import { getAdminRole } from "@/lib/auth";
import { AdminOpportunitiesClient } from "@/components/admin/opportunities-client";

export default async function AdminOpportunitiesPage() {
  const role = await getAdminRole();
  return <AdminOpportunitiesClient role={role} />;
}
