import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminMarketsLoader } from "@/components/admin/markets-loader";

export default function AdminMarketsPage() {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminMarketsLoader />
    </Suspense>
  );
}
