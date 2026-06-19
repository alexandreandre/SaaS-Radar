import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminUsersLoader } from "@/components/admin/users-loader";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export default function AdminUsersPage({ searchParams }: { searchParams?: SearchParamsInput }) {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminUsersLoader searchParams={searchParams} />
    </Suspense>
  );
}
