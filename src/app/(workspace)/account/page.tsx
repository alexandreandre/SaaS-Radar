import Link from "next/link";
import { LogOut } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { tierLabels, tierPrices, type Tier } from "@/lib/tier";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mon compte — SaaS Radar",
};

function normalizeTier(plan: string | undefined | null): Tier {
  return plan === "builder" || plan === "pro" ? plan : "free";
}

const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  trialing: "Période d'essai",
  past_due: "Paiement en retard",
  canceled: "Annulé",
  unpaid: "Impayé",
  incomplete: "Incomplet",
};

function formatPeriodEnd(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { checkout?: string; portal?: string };
}) {
  // Le layout (workspace) garantit la session ; lecture defensive ici.
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);
  const tier = normalizeTier(profile?.plan);
  const email = profile?.email ?? user?.email ?? "—";
  const status = profile?.subscription_status ?? null;
  const periodEnd = formatPeriodEnd(profile?.current_period_end);
  const checkoutSuccess = searchParams?.checkout === "success";
  const portalError = searchParams?.portal === "error";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-2xl font-medium tracking-tight">Mon compte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre profil et votre abonnement.
        </p>

        {checkoutSuccess ? (
          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
            Paiement confirmé. Votre accès est en cours d&apos;activation — il peut
            prendre quelques secondes à apparaître ci-dessous.
          </div>
        ) : null}
        {portalError ? (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-foreground">
            Impossible d&apos;ouvrir le portail de gestion pour le moment. Réessayez plus tard.
          </div>
        ) : null}

        <div className="mt-8 space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Profil
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">{email}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Plan actuel</dt>
                <dd className="font-medium text-foreground">
                  {tierLabels[tier]}
                  {tier !== "free" ? (
                    <span className="ml-2 text-muted-foreground">{tierPrices[tier]}</span>
                  ) : null}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Abonnement
            </h2>

            {tier !== "free" && status ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Statut</dt>
                  <dd className="font-medium text-foreground">
                    {SUBSCRIPTION_STATUS_LABEL[status] ?? status}
                  </dd>
                </div>
                {periodEnd ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {status === "canceled" ? "Fin d'accès" : "Prochain renouvellement"}
                    </dt>
                    <dd className="font-medium text-foreground">{periodEnd}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Passez à un plan supérieur pour débloquer le contenu premium des fiches.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {tier === "free" ? (
                <Button asChild>
                  <Link href="/pricing">Voir les plans</Link>
                </Button>
              ) : (
                <form action="/api/stripe/portal" method="post">
                  <Button type="submit">Gérer l&apos;abonnement</Button>
                </form>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Session
            </h2>
            <form action="/auth/signout" method="post" className="mt-4">
              <Button type="submit" variant="outline">
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
