import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminSystemLoader } from "@/components/admin/system-loader";

export default function AdminSystemPage() {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminSystemLoader />
    </Suspense>
  );
}
