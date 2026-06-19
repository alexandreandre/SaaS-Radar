import { Suspense } from "react";
import AdminConsoleLoading from "../loading";
import { AdminNewsletterLoader } from "@/components/admin/newsletter-loader";

export default function AdminNewsletterPage() {
  return (
    <Suspense fallback={<AdminConsoleLoading />}>
      <AdminNewsletterLoader />
    </Suspense>
  );
}
