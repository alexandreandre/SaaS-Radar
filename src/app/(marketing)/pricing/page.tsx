import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PricingPlans } from "./pricing-plans";
import { PricingFaq } from "./pricing-faq";

export const metadata = {
  title: "Tarifs — SaaS Radar",
};

const testimonials = [
  {
    quote: "J'ai lancé mon SaaS de devis BTP en 11 jours. Premier client la semaine suivante.",
    name: "Thomas R.",
    location: "Bordeaux",
    plan: "Builder",
    mrr: "2 400€ MRR",
  },
  {
    quote: "Le prompt Claude Code m'a économisé 3 semaines de dev. Le guide est béton.",
    name: "Sarah M.",
    location: "Lyon",
    plan: "Pro",
    mrr: "4 800€ MRR",
  },
  {
    quote: "Sans SaaS Radar j'aurais encore cherché mon idée. Là je code depuis 2 semaines.",
    name: "Kevin D.",
    location: "Paris",
    plan: "Builder",
    mrr: "En cours de lancement",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <PricingPlans />

        <section className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="mb-10 text-center font-display text-2xl font-medium tracking-tight text-foreground">
            Ils ont lancé avec SaaS Radar
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-muted/20 p-6">
                <p className="mb-3 text-primary">★★★★★</p>
                <p className="mb-4 text-sm italic text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.location} · {t.plan}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {t.mrr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PricingFaq />
      </main>
      <Footer />
    </div>
  );
}
