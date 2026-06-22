import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { StartClient } from "./start-client";

export default function StartPage() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute inset-0 road-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>
      <Navbar />
      <StartClient />
      <Footer />
    </>
  );
}
