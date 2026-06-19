import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminCockpitLoader } from "@/components/admin/cockpit-loader";

export default function AdminCockpitPage() {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminCockpitLoader />
    </Suspense>
  );
}
