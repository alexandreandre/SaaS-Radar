import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MesSaasHeader } from "./mes-saas-header";
import { MesSaasContentSkeleton } from "./mes-saas-content-skeleton";

export default function MesSaasLoading() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <MesSaasHeader />
        <MesSaasContentSkeleton />
      </main>
      <Footer />
    </>
  );
}
