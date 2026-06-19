"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import type { BuildSetup, UserProject } from "@/lib/portfolio";
import { hasCustomProductName, resolveProductName } from "@/lib/portfolio";
import type { BuildTool } from "@/lib/build/tools";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Button } from "@/components/ui/button";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";
import { cn } from "@/lib/utils";
import { BuildToolLogo, BuildToolName } from "@/components/cockpit/build/build-tool-logo";
import { BuildPlatformTips } from "@/components/cockpit/build/build-platform-tips";
import { BuildPromptLanguageToggle } from "@/components/cockpit/build/build-prompt-language-toggle";
import { BuildControls } from "@/components/cockpit/build/build-controls";
import { BuildInfraCallout } from "@/components/cockpit/build/build-infra-callout";
import { BuildSetupGuide } from "@/components/cockpit/build/build-setup-guide";
import { hasPlatformTips } from "@/lib/build/platform-tips";
import type { EnvVarSpec, InfraService } from "@/lib/build/infra-profile";
import { getSavedBuildToolIds } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import { getInfraProfile, shouldShowInfraCallout } from "@/lib/build/infra-profile";
import {
  buildSetupGuideFromOpportunity,
  getSetupGuideSubtitle,
} from "@/lib/build/setup-guide";
import {
  BUILD_PROMPT_LANGUAGE_LABELS,
  type BuildPromptLanguage,
} from "@/lib/build/prompt-language";

type BuildRecipeCardProps = {
  tool: BuildTool;
  opportunity: Opportunity;
  opportunitySlug: string;
  project: UserProject;
  mvpFeatures?: string[];
  setup?: BuildSetup;
  promptLanguage: BuildPromptLanguage;
  onPromptLanguageChange: (language: BuildPromptLanguage) => void;
  loading?: boolean;
  onGenerated: (setup: BuildSetup) => void;
  onRegenerate: () => void;
  onRestoreVersion: (savedAt: string) => void;
  onReset: (opts: {
    keepRoadmap?: boolean;
    keepHistory?: boolean;
    keepTool?: boolean;
    clearAllBuildKits?: boolean;
  }) => void;
};

function KitSection({
  title,
  subtitle,
  children,
  variant = "guide",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  variant?: "guide" | "prompt";
}) {
  return (
    <section
      className={cn(
        variant === "prompt"
          ? "rounded-xl border-2 border-primary/30 bg-primary/[0.04] p-4 shadow-sm"
          : "rounded-xl border border-border/70 bg-background p-4",
      )}
    >
      <header className="mb-3">
        <h4
          className={cn(
            "text-sm font-semibold",
            variant === "prompt" ? "text-primary" : "text-foreground",
          )}
        >
          {title}
        </h4>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function KitGenerateActions({
  promptLanguage,
  onPromptLanguageChange,
  onAction,
  actionLabel,
  busy,
  disabled = false,
}: {
  promptLanguage: BuildPromptLanguage;
  onPromptLanguageChange: (language: BuildPromptLanguage) => void;
  onAction: () => void;
  actionLabel: string;
  busy: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <BuildPromptLanguageToggle
        value={promptLanguage}
        onChange={onPromptLanguageChange}
      />
      <Button type="button" className="gap-2" disabled={busy || disabled} onClick={onAction}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {actionLabel}
      </Button>
    </div>
  );
}

function PromptCopyBlock({ text, tool }: { text: string; tool: BuildTool }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-primary/20 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 bg-primary/5 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>
            Texte à coller dans le chat <BuildToolName tool={tool} size="xs" />
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => void handleCopy()}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Prompt copié" : "Copier le prompt"}
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-foreground/90">
        {text}
      </pre>
    </div>
  );
}

export function BuildRecipeCard({
  tool,
  opportunity,
  opportunitySlug,
  project,
  mvpFeatures = [],
  setup,
  promptLanguage,
  onPromptLanguageChange,
  loading = false,
  onGenerated,
  onRegenerate,
  onRestoreVersion,
  onReset,
}: BuildRecipeCardProps) {
  const { tier } = useTier();
  const unlocked = hasTier(tier, "builder");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (mode: "mvp" | "regenerate" = "mvp") => {
      const productName = project.productName?.trim();
      if (!productName) {
        setError("Choisissez un nom de produit avant de générer le kit.");
        return;
      }
      setGenerating(true);
      setError(null);
      try {
        const res = await fetch("/api/build/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(opportunitySlug && opportunitySlug !== "__idea__"
              ? { opportunitySlug }
              : { projectId: project.id }),
            toolId: tool.id,
            mode,
            language: promptLanguage,
            productName,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur de génération");
        const next: BuildSetup = {
          toolId: tool.id,
          mvpPrompt: data.mvpPrompt,
          setupRecipe: data.setupRecipe,
          generatedAt: data.generatedAt,
          language: data.language ?? promptLanguage,
          productName,
          infraSummary: data.infra?.summary,
          expectedEnvVars: data.infra?.envVars as EnvVarSpec[] | undefined,
          infraServices: data.infra?.services as InfraService[] | undefined,
          infraSetupSteps: data.infra?.setupSteps as string[] | undefined,
        };
        onGenerated(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setGenerating(false);
      }
    },
    [opportunitySlug, tool.id, promptLanguage, onGenerated, project.productName, project.id],
  );

  const busy = loading || generating;
  const topFeatures = mvpFeatures.slice(0, 3);
  const languageMismatch = setup?.language && setup.language !== promptLanguage;
  const nameMismatch =
    setup?.productName &&
    project.productName?.trim() &&
    setup.productName !== project.productName.trim();
  const canGenerate = hasCustomProductName(project);
  const infraProfile = useMemo(
    () => getInfraProfile(opportunity, tool),
    [opportunity, tool],
  );
  const setupGuideSteps = useMemo(() => {
    const productName = resolveProductName(project, opportunity);
    const lang = setup?.language ?? promptLanguage;
    return buildSetupGuideFromOpportunity({
      tool,
      productName,
      opportunity,
      infraProfile,
      language: lang,
    });
  }, [tool, opportunity, project, setup?.language, promptLanguage, infraProfile]);
  const otherToolIds = getSavedBuildToolIds(project).filter((id) => id !== tool.id);
  const showInfraCallout = Boolean(
    setup?.infraSummary && shouldShowInfraCallout(infraProfile),
  );
  const needsInfraRegeneration = Boolean(setup?.mvpPrompt && !setup.infraSummary);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <BuildToolLogo toolId={tool.id} size="lg" />
          <div className="min-w-0">
            <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
              Généré pour {tool.name}
            </p>
            <h3 className="mt-1 text-lg font-semibold">Votre kit de démarrage</h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={tool.deepLink} target="_blank" rel="noopener noreferrer" className="gap-2">
              <BuildToolLogo toolId={tool.id} size="sm" variant="inline" />
              Ouvrir {tool.name}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          {setup ? (
            <BuildControls
              project={project}
              currentTool={tool}
              onRestoreVersion={onRestoreVersion}
              onReset={onReset}
            />
          ) : null}
        </div>
      </div>

      {topFeatures.length > 0 ? (
        <div className="mb-4 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ce que vous construisez
          </p>
          <ul className="mt-2 space-y-1">
            {topFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/90">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!unlocked ? (
        <PaywallGate
          requiredTier="builder"
          preview="Kit personnalisé pour votre opportunité — prêt à coller dans votre outil."
          message="Débloquez la génération avec le plan Builder."
        >
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sélectionnez un outil puis générez votre kit personnalisé.
          </div>
        </PaywallGate>
      ) : !setup ? (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            On prépare un guide adapté à <BuildToolName tool={tool} size="xs" /> et à votre
            opportunité.
          </p>
          {!canGenerate ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Choisissez d&apos;abord un nom de produit ci-dessus.
            </p>
          ) : null}
          <KitGenerateActions
            promptLanguage={promptLanguage}
            onPromptLanguageChange={onPromptLanguageChange}
            busy={busy}
            disabled={!canGenerate}
            actionLabel="Générer mon kit"
            onAction={() => void generate("mvp")}
          />
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </div>
      ) : (
        <div className="space-y-4">
          {needsInfraRegeneration ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              Kit généré avant la mise à jour — régénérez pour inclure auth, BDD et variables
              d&apos;environnement explicites.
            </div>
          ) : null}
          {nameMismatch ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              Le nom a changé — régénérez le kit pour mettre à jour les prompts.
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              {languageMismatch ? (
                <>
                  Prompt en {BUILD_PROMPT_LANGUAGE_LABELS[setup.language ?? promptLanguage]} — régénérez
                  en {BUILD_PROMPT_LANGUAGE_LABELS[promptLanguage]}
                </>
              ) : (
                <>
                  Prompt généré en{" "}
                  <span className="font-medium text-foreground">
                    {BUILD_PROMPT_LANGUAGE_LABELS[setup.language ?? promptLanguage]}
                  </span>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <BuildPromptLanguageToggle
                value={promptLanguage}
                onChange={onPromptLanguageChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={busy || !canGenerate}
                onClick={() => {
                  onRegenerate();
                  void generate("regenerate");
                }}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
                Régénérer
              </Button>
            </div>
          </div>

          {setup.mvpPrompt ? (
            <KitSection
              title="Ce que vous demandez à l'IA"
              subtitle="Le seul bloc à copier-coller — tout le reste est un guide pour vous"
              variant="prompt"
            >
              <PromptCopyBlock text={setup.mvpPrompt} tool={tool} />
            </KitSection>
          ) : null}

          {showInfraCallout && setup?.infraSummary ? (
            <BuildInfraCallout
              summary={setup.infraSummary}
              services={(setup.infraServices ?? []) as InfraService[]}
              envVars={setup.expectedEnvVars ?? []}
              setupSteps={setup.infraSetupSteps ?? []}
              primaryBackend={
                setup.expectedEnvVars?.some((v) => v.name.includes("SUPABASE"))
                  ? "supabase"
                  : setup.expectedEnvVars?.some((v) => v.name.includes("FIREBASE"))
                    ? "firebase"
                    : null
              }
              activeToolId={tool.id}
              otherToolIds={otherToolIds}
            />
          ) : null}

          {setupGuideSteps.length > 0 ? (
            <KitSection
              title="Comment démarrer"
              subtitle={getSetupGuideSubtitle(tool, setup?.language ?? promptLanguage)}
            >
              <BuildSetupGuide steps={setupGuideSteps} />
            </KitSection>
          ) : null}

          {hasPlatformTips(tool.id) ? <BuildPlatformTips tool={tool} /> : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
