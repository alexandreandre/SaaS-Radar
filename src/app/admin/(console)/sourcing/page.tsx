import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { SourcingLoader } from "@/components/admin/sourcing-loader";

export default function AdminSourcingPage() {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <SourcingLoader />
    </Suspense>
  );
}
