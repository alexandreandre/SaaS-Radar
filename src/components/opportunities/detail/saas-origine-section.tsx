import { ExternalLink } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import { defaultForeignMarketProfile } from "@/data/opportunity-enrichment";
import { formatSaasOriginTitle, countryPrepositionPhrase } from "@/lib/country-labels";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import { cn } from "@/lib/utils";

interface SaasOrigineSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "page" | "playbook";
}

function isValidHttpUrl(url: string | undefined): url is string {
  if (!url || url === "#") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function SaasOrigineSection({
  opportunity,
  animationIndex,
  variant = "page",
}: SaasOrigineSectionProps) {
  const profile = opportunity.foreignMarketProfile ?? defaultForeignMarketProfile(opportunity);
  const franceAdaptation = profile.franceAdaptation ?? opportunity.franceAnalysis ?? [];
  const isPlaybook = variant === "playbook";
  const cardPadding = isPlaybook ? "p-4" : "p-5";
  const sectionMargin = isPlaybook ? "mb-0" : "mb-12";

  const countryPhrase = countryPrepositionPhrase(profile.country, opportunity.originCountryCode);
  const title = formatSaasOriginTitle(profile.country, opportunity.originCountryCode);
  const siteUrl = isValidHttpUrl(opportunity.url)
    ? opportunity.url
    : `https://www.google.com/search?q=${encodeURIComponent(profile.productName)}`;
  const siteLinkLabel = isValidHttpUrl(opportunity.url) ? "Voir le site" : "Rechercher le produit";

  const badgeLabel = opportunity.sourceVerified
    ? "Source vérifiée ✓"
    : profile.tractionHighlights.length > 0
      ? "Signaux de traction"
      : null;

  const hasSourceKeyFeatures = profile.keyFeatures.length > 0;

  return (
    <AnimatedSection
      id="saas-origine"
      animationIndex={animationIndex}
      className={cn(sectionMargin, "scroll-mt-24")}
    >
      <SectionTitle
        number={isPlaybook ? 4 : 5}
        title={title}
        subtitle={
          isPlaybook
            ? `Le modèle qui cartonne déjà ${profile.flag} ${profile.country} — avant de le lancer en France`
            : undefined
        }
        variant={isPlaybook ? "playbook" : "detail"}
      />
      {!isPlaybook ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Le modèle qui cartonne déjà {profile.flag} {profile.country} — avant de le lancer en France
        </p>
      ) : null}

      <div
        className={cn(
          "relative mb-4 overflow-hidden border",
          isPlaybook ? "rounded-lg border-border/40 bg-muted/10 p-3.5" : "rounded-2xl border-border bg-card p-6",
        )}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Inspiré de</p>
            <h3 className="text-2xl font-bold text-foreground">{profile.productName}</h3>
            <p className="mt-1 text-muted-foreground">{profile.tagline}</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {profile.flag} {profile.country}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {siteLinkLabel} <ExternalLink className="h-3 w-3" />
            </a>
            {badgeLabel ? (
              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-600 dark:text-emerald-400">
                {badgeLabel}
              </span>
            ) : null}
          </div>
        </div>

        {isPlaybook ? (
          profile.tractionHighlights.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              <a href="#chiffres" className="text-primary underline-offset-2 hover:underline">
                Voir les chiffres ↑ (section 02)
              </a>
            </p>
          ) : null
        ) : profile.tractionHighlights.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {profile.tractionHighlights.map((signal, i) => (
              <a
                key={`${signal.label}-${i}`}
                href={signal.sourceUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl bg-muted/60 p-3 transition-colors hover:bg-muted/50"
              >
                <p className="mb-1 text-xs text-muted-foreground">{signal.label}</p>
                <p className="text-base font-bold text-foreground md:text-lg">{signal.value}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/60">
                  {signal.source}
                  <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className={cn("mb-4 grid grid-cols-1", isPlaybook ? "gap-3 md:grid-cols-2" : "gap-4 md:grid-cols-3")}>
        <div
          className={cn(
            cardPadding,
            isPlaybook ? "rounded-lg border border-border/40 bg-muted/10" : "rounded-xl border border-border bg-card",
          )}
        >
          <p
            className={cn(
              "text-muted-foreground",
              isPlaybook
                ? "mb-2 text-[10px] font-medium uppercase tracking-wide"
                : "mb-3 text-xs uppercase tracking-widest",
            )}
          >
            Le problème résolu
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{profile.problemSolved}</p>
        </div>
        <div
          className={cn(
            cardPadding,
            isPlaybook ? "rounded-lg border border-border/40 bg-muted/10" : "rounded-xl border border-border bg-card",
          )}
        >
          <p
            className={cn(
              "text-muted-foreground",
              isPlaybook
                ? "mb-2 text-[10px] font-medium uppercase tracking-wide"
                : "mb-3 text-xs uppercase tracking-widest",
            )}
          >
            Clients cibles
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{profile.targetUsers}</p>
        </div>
        <div
          className={cn(
            "md:col-span-1",
            cardPadding,
            isPlaybook ? "rounded-lg border border-border/40 bg-muted/10 md:col-span-2" : "rounded-xl border border-border bg-card",
          )}
        >
          <p
            className={cn(
              "text-muted-foreground",
              isPlaybook
                ? "mb-2 text-[10px] font-medium uppercase tracking-wide"
                : "mb-3 text-xs uppercase tracking-widest",
            )}
          >
            Modèle économique
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">{profile.businessModel}</p>
          <p className="mt-2 text-sm font-medium text-primary">{profile.pricing}</p>
        </div>
      </div>

      {profile.howItWorks ? (
        <div className={cn("mb-4 rounded-xl border border-border bg-card", cardPadding)}>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Comment ça fonctionne</p>
          <p className="text-sm leading-relaxed text-foreground/80">{profile.howItWorks}</p>
        </div>
      ) : null}

      {hasSourceKeyFeatures ? (
        <div className={cn("mb-4 rounded-xl border border-border bg-card", cardPadding)}>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Fonctionnalités clés du produit source
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {profile.keyFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <span className="shrink-0 text-emerald-600 dark:text-emerald-400">✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn("mb-4 rounded-xl border border-dashed border-border bg-muted/20", cardPadding)}>
          <p className="text-sm text-muted-foreground">
            Profil source en cours d&apos;enrichissement — les fonctionnalités du produit d&apos;origine seront
            disponibles prochainement.
          </p>
        </div>
      )}

      {profile.whyItWorksThere.length > 0 && !isPlaybook ? (
        <div className={cn("mb-4 rounded-xl border border-border bg-card", cardPadding)}>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Pourquoi ça cartonne {countryPhrase}
          </p>
          <div className="space-y-2">
            {profile.whyItWorksThere.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-bold text-primary">{i + 1}.</span>
                <p className="text-sm leading-relaxed text-foreground/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={cn("rounded-xl border border-emerald-900/30 bg-card", cardPadding)}>
        <p className="mb-3 text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
          {isPlaybook ? "Adaptation France" : "🇫🇷 Adaptation France"}
        </p>
        <div className="mb-4 space-y-2">
          {franceAdaptation.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
              <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">→</span>
              {item}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Réglementation</p>
            <p className="text-sm text-foreground/80">{opportunity.franceFitCriteria.regulation}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Concurrence actuelle</p>
            <p className="text-sm text-foreground/80">{opportunity.franceFitCriteria.competitors}</p>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
