import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminAuditLoader } from "@/components/admin/audit-loader";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export default function AdminAuditPage({ searchParams }: { searchParams?: SearchParamsInput }) {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminAuditLoader searchParams={searchParams} />
    </Suspense>
  );
}
