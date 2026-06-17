import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const comparison = [
  { feature: "Opportunités validées à l'étranger", us: true, training: false },
  { feature: "Scores France Fit + Buildability", us: true, training: false },
  { feature: "Projections financières par scénario", us: true, training: false },
  { feature: "Prompt Claude Code prêt à l'emploi", us: true, training: false },
  { feature: "CAC par canal (chiffres réels)", us: true, training: false },
  { feature: "Mise à jour hebdomadaire", us: true, training: false },
  { feature: "Contenu générique « entrepreneuriat »", us: false, training: true },
  { feature: "Prix", us: "29€/mois", training: "3 000€+" },
];

const pricing = [
  {
    name: "Free",
    price: "0€",
    desc: "Découvrez le potentiel",
    features: ["3 opportunités/mois", "Scores de base", "Newsletter quotidienne"],
    cta: "Commencer gratuit",
    highlight: false,
  },
  {
    name: "Builder",
    price: "29€",
    desc: "Pour lancer votre MVP",
    features: ["Toutes les opportunités", "MVP Plan + stack", "Simulateur financier", "Comparateur 3 idées"],
    cta: "Devenir Builder",
    highlight: true,
  },
  {
    name: "Pro",
    price: "79€",
    desc: "Pour scaler vite",
    features: ["Prompt Claude Code", "Acquisition par canal", "Watchlist + alertes", "Journal de lancement"],
    cta: "Passer Pro",
    highlight: false,
  },
];

export function HomeStaticSections() {
  return (
    <>
      <section className="border-y border-border bg-muted/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="label-data text-center">Comparatif</p>
          <h2 className="mt-2 text-center font-display text-2xl font-medium tracking-tight">
            Pourquoi ça bat une formation à 3 000€
          </h2>
          <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">Critère</th>
                  <th className="px-6 py-4 text-center font-semibold text-primary">SaaS Radar</th>
                  <th className="px-6 py-4 text-center font-medium text-muted-foreground">Formation classique</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.us === "boolean" ? (
                        row.us ? (
                          <Check className="mx-auto h-5 w-5 text-primary" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="font-data font-semibold tabular-nums text-primary">{row.us}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof row.training === "boolean" ? (
                        row.training ? (
                          <Check className="mx-auto h-5 w-5 text-muted-foreground" />
                        ) : (
                          <X className="mx-auto h-5 w-5 text-muted-foreground/40" />
                        )
                      ) : (
                        <span className="text-muted-foreground">{row.training}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="font-display text-5xl font-medium tabular-nums text-foreground">127</p>
          <p className="mt-2 text-muted-foreground">entrepreneurs ont lancé ce mois-ci</p>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="label-data text-center">Tarifs</p>
          <h2 className="mt-2 text-center font-display text-2xl font-medium tracking-tight">Simples, sans surprise</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Annulez quand vous voulez.</p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "rounded-lg border bg-card p-6 shadow-card",
                  plan.highlight ? "border-primary shadow-card-hover ring-1 ring-primary" : "border-border"
                )}
              >
                {plan.highlight && (
                  <span className="rounded-sm bg-accent px-2 py-0.5 font-data text-[10px] font-medium uppercase tracking-data text-accent-foreground">
                    Populaire
                  </span>
                )}
                <h3 className="mt-4 text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 font-display text-3xl font-medium tabular-nums">
                  {plan.price}
                  <span className="text-base font-sans font-normal text-muted-foreground">/mois</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-8 w-full" variant={plan.highlight ? "default" : "outline"} asChild>
                  <Link href="/mes-saas">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
