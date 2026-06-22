import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { MAP_EXPLORE_HREF } from "@/lib/map-routes";

export const metadata = {
  title: "Bientôt — SaaS Radar",
  description:
    "Le cockpit de build arrive bientôt. Explorez les opportunités micro-SaaS et inscrivez-vous à la newsletter.",
};

export default function BientotPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="font-data text-xs uppercase tracking-data text-primary">En construction</p>
        <h1 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Le cockpit de build arrive bientôt
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Nous ouvrons d&apos;abord le catalogue d&apos;opportunités validées à l&apos;international.
          Le parcours build, campagne et pilotage MRR sera disponible dans une prochaine version.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/newsletter">S&apos;inscrire à la newsletter</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/opportunities">Voir les opportunités</Link>
          </Button>
        </div>
        <p className="mt-8">
          <Link
            href={MAP_EXPLORE_HREF}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Explorer la carte du monde
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
