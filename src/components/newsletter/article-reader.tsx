import Link from "next/link";
import type { NewsArticle } from "@/data/newsletter";
import { categoryLabels } from "@/data/newsletter";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function ArticleReader({
  article,
  linkedOpportunitySlug,
}: {
  article: NewsArticle;
  linkedOpportunitySlug?: string | null;
}) {
  const requiredTier = article.tier === "free" ? "free" : article.tier;

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour
      </Link>

      <header className="mt-8 border-b border-border pb-8">
        <p className="font-data text-[10px] font-medium uppercase tracking-data text-primary">
          {categoryLabels[article.category]}
        </p>
        <h1 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <p className="mt-4 font-data text-[10px] uppercase tracking-data text-muted-foreground">
          {article.dateLabel} · {article.readMinutes} min de lecture
        </p>
      </header>

      {requiredTier === "free" ? (
        <div className="prose-newsletter mt-10 space-y-5 text-base leading-[1.75] text-foreground">
          {article.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : (
        <PaywallGate
          requiredTier={requiredTier}
          className="mt-10"
          preview={
            <p className="text-base leading-relaxed text-muted-foreground">{article.body[0]}</p>
          }
          message={
            requiredTier === "pro"
              ? "Passez en Pro pour lire cet article et recevoir le prompt Claude Code associé."
              : "Passez en Builder pour lire cet article en entier."
          }
        >
          <div className="space-y-5 text-base leading-[1.75] text-foreground">
            {article.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </PaywallGate>
      )}

      {linkedOpportunitySlug && (
        <div className="mt-12 rounded-lg border border-border bg-muted/40 p-5">
          <p className="label-data">Opportunité liée</p>
          <Button className="mt-3" asChild>
            <Link href={`/opportunities/${linkedOpportunitySlug}`}>
              Voir la fiche analyste →
            </Link>
          </Button>
        </div>
      )}
    </article>
  );
}
