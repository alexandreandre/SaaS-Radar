import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminBillingLoader } from "@/components/admin/billing-loader";

export default function AdminBillingPage() {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminBillingLoader />
    </Suspense>
  );
}
