import { Suspense } from "react";
import { MesSaasClient } from "./mes-saas-client";

export const dynamic = "force-dynamic";

export default function MesSaasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-muted/30" />}>
      <MesSaasClient />
    </Suspense>
  );
}
