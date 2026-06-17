"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Mail,
  MessageSquare,
  Wand2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Opportunity } from "@/types/opportunity";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { UserProject } from "@/lib/portfolio";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import {
  PlaybookClientsBridge,
  PlaybookClientsContextBanner,
  PlaybookStartHereBanner,
} from "@/components/cockpit/playbook/playbook-clients-context";
import { getCacForChannel, resolveChannelKey } from "@/lib/acquisition-channels";
import {
  generateAcquisitionContent,
  getGeneratorTabLabels,
  type GeneratorType,
} from "@/lib/acquisition-content";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";

interface AcquisitionSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "detail" | "playbook";
  project?: UserProject;
  data?: CockpitData;
  onModuleChange?: (module: CockpitModuleId) => void;
}

const TOOL_META: Record<
  string,
  { url: string; color: string; toolName: string }
> = {
  "Cold email": {
    url: "https://hunter.io",
    color: "text-red-400",
    toolName: "Hunter.io",
  },
  LinkedIn: {
    url: "https://linkedin.com",
    color: "text-blue-500",
    toolName: "LinkedIn",
  },
  SEO: {
    url: "https://search.google.com/search-console",
    color: "text-orange-400",
    toolName: "Google Search Console",
  },
  Referral: {
    url: "https://partnerstack.com",
    color: "text-green-400",
    toolName: "PartnerStack",
  },
};

const DEFAULT_TOOL_META = {
  url: "https://google.com",
  color: "text-muted-foreground",
  toolName: "Outil recommandé",
};

const GENERATOR_ICONS = {
  prompt: Bot,
  email: Mail,
  message: MessageSquare,
} as const;

function getFaviconDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "google.com";
  }
}

function channelKey(tab: { id?: string; title: string }, index: number): string {
  return tab.id ?? tab.title ?? String(index);
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Copié !</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copier
        </>
      )}
    </button>
  );
}

function CacSummaryTable({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Canal</th>
            <th className="px-3 py-2 font-medium">CAC estimé</th>
            <th className="hidden px-3 py-2 font-medium sm:table-cell">Note</th>
          </tr>
        </thead>
        <tbody>
          {opportunity.cacChannels.map((c) => (
            <tr key={c.channel} className="border-b border-border/60 last:border-0">
              <td className="px-3 py-2">{c.channel}</td>
              <td className="px-3 py-2 font-data font-medium tabular-nums">
                ≈ {formatCurrency(c.estimate)}
              </td>
              <td className="hidden px-3 py-2 text-xs text-muted-foreground sm:table-cell">
                {c.note}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PremiumExtras({ opportunity }: { opportunity: Opportunity }) {
  const templates = opportunity.emailTemplates ?? [];
  const partners = opportunity.partnersFR ?? [];
  const competitors = opportunity.frenchCompetitors ?? [];
  const { tier } = useTier();

  if (templates.length === 0 && partners.length === 0 && competitors.length === 0) {
    if (hasTier(tier, "pro")) return null;
    return (
      <div className="mt-6 space-y-3">
        <PaywallGate
          requiredTier="pro"
          preview={
            <p className="text-sm text-muted-foreground">
              Templates emails prêts à copier et partenaires FR à contacter
            </p>
          }
          message="Templates copy-paste et liste de partenaires — Pro"
        >
          <div className="p-4 text-sm text-muted-foreground">Templates et partenaires Pro</div>
        </PaywallGate>
        {!hasTier(tier, "builder") ? (
          <PaywallGate
            requiredTier="builder"
            preview={
              <p className="text-sm text-muted-foreground">
                Concurrents déjà présents en France
              </p>
            }
            message="Analyse concurrentielle FR — Builder"
          >
            <div className="p-4 text-sm text-muted-foreground">Analyse concurrentielle Builder</div>
          </PaywallGate>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {templates.length > 0 ? (
        <details className="group rounded-lg border border-border/60 bg-muted/10">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Templates emails prêts ({templates.length})
            </span>
          </summary>
          <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
            {templates.map((t) => (
              <div key={t.name} className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-1 font-data text-xs text-muted-foreground">Objet : {t.subject}</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                  {t.body}
                </pre>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {partners.length > 0 ? (
        <details className="group rounded-lg border border-border/60 bg-muted/10">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Partenaires FR à contacter ({partners.length})
            </span>
          </summary>
          <ul className="space-y-2 border-t border-border/60 px-4 pb-4 pt-3">
            {partners.map((p) => (
              <li key={p.name} className="rounded-lg border border-border bg-card p-3 text-sm">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.type}</p>
                <p className="mt-1 text-muted-foreground">{p.angle}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {competitors.length > 0 ? (
        <details className="group rounded-lg border border-border/60 bg-muted/10">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              Concurrents en France ({competitors.length})
            </span>
          </summary>
          <ul className="space-y-2 border-t border-border/60 px-4 pb-4 pt-3">
            {competitors.slice(0, 4).map((c) => (
              <li key={c.name} className="rounded-lg border border-border bg-card p-3 text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground"> — {c.weakness}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function AcquisitionSection({
  opportunity,
  animationIndex,
  variant = "detail",
  project,
  data,
  onModuleChange,
}: AcquisitionSectionProps) {
  const isPlaybook = variant === "playbook";
  const hasCockpitContext = Boolean(project && data);
  const firstChannelKey = channelKey(opportunity.acquisition[0] ?? { title: "" }, 0);

  const [activeGenerator, setActiveGenerator] = useState<string | null>(null);
  const [generatorTypes, setGeneratorTypes] = useState<Record<string, GeneratorType>>({});
  const [expandedTactics, setExpandedTactics] = useState<Set<string>>(() =>
    isPlaybook && firstChannelKey ? new Set([firstChannelKey]) : new Set(),
  );

  const getGeneratorType = (key: string): GeneratorType => generatorTypes[key] ?? "prompt";

  const setGeneratorType = (key: string, type: GeneratorType) => {
    setGeneratorTypes((prev) => ({ ...prev, [key]: type }));
  };

  const toggleTactics = (key: string) => {
    setExpandedTactics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <AnimatedSection
      id="acquisition"
      animationIndex={animationIndex}
      className={cn(isPlaybook ? "mb-0" : "mb-12 scroll-mt-24")}
    >
      {isPlaybook && hasCockpitContext && project && data ? (
        <div className="mb-5">
          <PlaybookClientsContextBanner
            opportunity={opportunity}
            project={project}
            data={data}
            onModuleChange={onModuleChange}
          />
        </div>
      ) : null}

      <SectionTitle
        number={isPlaybook ? 1 : 7}
        title="Trouver tes clients"
        subtitle={isPlaybook ? "Canaux qui convertissent — tactiques concrètes" : undefined}
        variant={isPlaybook ? "playbook" : "detail"}
      />
      {!isPlaybook ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Les canaux qui convertissent — tactiques concrètes et outils cliquables
        </p>
      ) : null}

      {isPlaybook ? <PlaybookStartHereBanner opportunity={opportunity} /> : null}
      {isPlaybook ? <CacSummaryTable opportunity={opportunity} /> : null}

      <div className="mb-6 space-y-3">
        {opportunity.acquisition.map((tab, i) => {
          const meta = TOOL_META[tab.title] ?? DEFAULT_TOOL_META;
          const key = channelKey(tab, i);
          const isOpen = activeGenerator === key;
          const isRecommended = i === 0;
          const cac = getCacForChannel(opportunity.cacChannels, tab.title);
          const genType = getGeneratorType(key);
          const generatedContent = generateAcquisitionContent(opportunity, tab.title, genType);
          const faviconDomain = getFaviconDomain(meta.url);
          const tacticsExpanded = !isPlaybook || expandedTactics.has(key);
          const generatorTabs = getGeneratorTabLabels(resolveChannelKey(tab.title));

          return (
            <div
              key={key}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen ? "border-border bg-card" : "border-border bg-muted/20",
                isRecommended && isPlaybook && "ring-1 ring-primary/20",
              )}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={`https://www.google.com/s2/favicons?domain=${faviconDomain}&sz=32`}
                    alt={tab.title}
                    width={20}
                    height={20}
                    unoptimized
                    className="h-5 w-5"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{tab.title}</p>
                    {isRecommended && isPlaybook ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-data text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Recommandé
                      </span>
                    ) : null}
                    <a
                      href={meta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("flex items-center gap-1 text-xs hover:underline", meta.color)}
                    >
                      {meta.toolName} <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    CAC : {cac ? `≈ ${formatCurrency(cac.estimate)}` : "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGenerator(isOpen ? null : key)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Wand2 className="h-3 w-3" />
                  Générer
                </button>
              </div>

              <div className="px-4 pb-2 pl-14">
                {isPlaybook ? (
                  <button
                    type="button"
                    onClick={() => toggleTactics(key)}
                    className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        tacticsExpanded && "rotate-180",
                      )}
                    />
                    {tacticsExpanded ? "Masquer les tactiques" : "Voir les tactiques"}
                    <span className="text-muted-foreground/60">({tab.tactics.length})</span>
                  </button>
                ) : null}
                {tacticsExpanded ? (
                  <ul className="space-y-1 pb-2">
                    {tab.tactics.map((tactic, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 shrink-0 text-muted-foreground/60">→</span>
                        {tactic}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {isOpen ? (
                <div className="border-t border-border p-4">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {generatorTabs.map((t) => {
                      const Icon = GENERATOR_ICONS[t.id];
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setGeneratorType(key, t.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                            genType === t.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative">
                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
                        {generatedContent}
                      </pre>
                    </div>
                    <div className="absolute right-3 top-3">
                      <CopyBtn text={generatedContent} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {isPlaybook ? <PremiumExtras opportunity={opportunity} /> : null}

      {isPlaybook && hasCockpitContext && onModuleChange ? (
        <PlaybookClientsBridge onModuleChange={onModuleChange} />
      ) : null}
    </AnimatedSection>
  );
}
