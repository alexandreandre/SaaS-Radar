import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminOpportunitiesLoader } from "@/components/admin/opportunities-loader";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export default function AdminOpportunitiesPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminOpportunitiesLoader searchParams={searchParams} />
    </Suspense>
  );
}
