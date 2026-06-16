import { getAdminRole } from "@/lib/auth";
import { SourcingConsole } from "@/components/admin/sourcing-console";

export default async function AdminSourcingPage() {
  const role = await getAdminRole();
  return <SourcingConsole role={role} />;
}
