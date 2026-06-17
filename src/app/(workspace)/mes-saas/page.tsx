import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MesSaasHeader } from "./mes-saas-header";
import { MesSaasContentSkeleton } from "./mes-saas-content-skeleton";

const MesSaasContent = dynamic(
  () => import("./mes-saas-content").then((m) => m.MesSaasContent),
  { loading: () => <MesSaasContentSkeleton /> },
);

export default function MesSaasPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <MesSaasHeader />
        <MesSaasContent />
      </main>
      <Footer />
    </>
  );
}
