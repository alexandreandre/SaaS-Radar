"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { BadgeCheck, Check, Copy, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types/opportunity";
import type { BuilderStage } from "@/lib/build-launch";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Button } from "@/components/ui/button";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";

const DEFAULT_STACK = ["Next.js 14", "Supabase", "Stripe", "Tailwind CSS"];
const TOOL_OPTIONS = ["Claude Code", "Cursor", "v0"] as const;
type ToolOption = (typeof TOOL_OPTIONS)[number];

type TechLevel = "none" | "medium" | "high";

const TECH_LEVEL_TOOLS: Record<TechLevel, ToolOption> = {
  none: "v0",
  medium: "Claude Code",
  high: "Cursor",
};

const TOOLS = [
  {
    key: "Claude Code" as const,
    name: "Claude Code",
    url: "https://claude.ai/code",
    favicon: "https://www.google.com/s2/favicons?domain=claude.ai&sz=32",
    time: "~4h",
    level: "Tous niveaux",
    levelColor: "text-green-400",
    description: "Meilleur pour comprendre et générer toute l'architecture",
    instruction: "Ouvre Claude Code → New conversation → Colle le prompt → Lance",
  },
  {
    key: "Cursor" as const,
    name: "Cursor",
    url: "https://cursor.sh",
    favicon: "https://www.google.com/s2/favicons?domain=cursor.sh&sz=32",
    time: "~3h",
    level: "Dev confirmé",
    levelColor: "text-blue-400",
    description: "Meilleur si tu veux coder et modifier en temps réel",
    instruction: 'Ouvre Cursor → Cmd+L → Colle le prompt → "génère tout"',
  },
  {
    key: "v0" as const,
    name: "v0 by Vercel",
    url: "https://v0.dev",
    favicon: "https://www.google.com/s2/favicons?domain=v0.dev&sz=32",
    time: "~2h",
    level: "No-code / Designer",
    levelColor: "text-purple-400",
    description: "Meilleur pour générer l'UI rapidement et exporter",
    instruction: "Va sur v0.dev → Colle le prompt → Génère l'UI → Exporte",
  },
] as const;

const PAYWALL_PLACEHOLDER = `Build a modern SaaS application for the French market.

Stack: Next.js 14, Supabase, Stripe, Tailwind CSS
Pages: Landing, Dashboard, Settings, Billing

Implement authentication, subscription billing, and core workflow features.
Use shadcn/ui components with a clean dark theme.`;

function CopyButton({
  text,
  variant = "default",
  className,
}: {
  text: string;
  variant?: "default" | "primary";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "primary") {
    return (
      <Button type="button" onClick={handleCopy} className={cn("gap-2", className)}>
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copié !
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copier le prompt
          </>
        )}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Copié !</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copier le prompt</span>
        </>
      )}
    </button>
  );
}

function getRecommendedStack(opportunity: Opportunity): string[] {
  if (opportunity.mvpPlan.stack.length > 0) {
    return opportunity.mvpPlan.stack;
  }

  const stackLine = opportunity.claudePrompt
    .split("\n")
    .find((line) => /^Stack:/i.test(line.trim()));

  if (stackLine) {
    const parsed = stackLine
      .replace(/^Stack:\s*/i, "")
      .split(/,|·|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (parsed.length > 0) return parsed;
  }

  return DEFAULT_STACK;
}

function getMvpPagesList(opportunity: Opportunity): string {
  const pagesLine = opportunity.claudePrompt
    .split("\n")
    .find((line) => /^Pages:/i.test(line.trim()));

  if (pagesLine) {
    return pagesLine
      .replace(/^Pages:\s*/i, "")
      .split(",")
      .map((page) => `- ${page.trim()}`)
      .join("\n");
  }

  return "- Dashboard\n- Settings\n- Billing";
}

function getPromptForTool(opportunity: Opportunity, tool: string): string {
  const base = opportunity.claudePrompt || PAYWALL_PLACEHOLDER;

  if (tool === "Cursor") {
    return `// CURSOR AGENT MODE
// Crée chaque fichier un par un, confirme avant de passer au suivant.

${base}

IMPORTANT: Use Cursor agent. Create files sequentially. Ask for confirmation at each major step.`;
  }

  if (tool === "v0") {
    return `// V0 BY VERCEL — UI ONLY
// Ce prompt génère uniquement les composants UI. Backend à brancher séparément avec Claude Code.

Create a modern SaaS dashboard UI for "${opportunity.name}".

Pages to generate:
${getMvpPagesList(opportunity)}

Design: dark theme, Tailwind CSS, shadcn/ui components.
Do NOT include backend logic, just the UI components.`;
  }

  return base;
}

function ToolSelector({
  selectedTool,
  onSelect,
}: {
  selectedTool: ToolOption;
  onSelect: (tool: ToolOption) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs text-muted-foreground">Générer le prompt pour :</p>
      <div className="flex gap-2">
        {TOOL_OPTIONS.map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => onSelect(tool)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              selectedTool === tool
                ? "border-blue-500 bg-blue-600 text-primary-foreground"
                : "border-border bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {tool}
          </button>
        ))}
      </div>
    </div>
  );
}

function TechLevelQuiz({
  techLevel,
  onSelectLevel,
  defaultOpen = true,
}: {
  techLevel: TechLevel | null;
  onSelectLevel: (level: TechLevel) => void;
  defaultOpen?: boolean;
}) {
  return (
    <details className="rounded-xl border border-border bg-card" open={defaultOpen}>
      <summary className="cursor-pointer px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
        Quelle plateforme pour toi ?
      </summary>
      <div className="border-t border-border px-5 pb-5 pt-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "none" as const, label: "Je ne code pas", emoji: "🎨" },
              { id: "medium" as const, label: "Je me débrouille", emoji: "⚡" },
              { id: "high" as const, label: "Je code bien", emoji: "💻" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectLevel(opt.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                techLevel === opt.id
                  ? "border-blue-500 bg-blue-600 text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {techLevel ? (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="mb-1 text-xs text-muted-foreground">Notre recommandation</p>
            {techLevel === "none" && (
              <>
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <Image
                    src="https://www.google.com/s2/favicons?domain=v0.dev&sz=32"
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4"
                  />
                  v0 by Vercel
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu génères l&apos;UI en no-code, puis tu demandes à Claude Code de brancher le
                  backend.
                </p>
              </>
            )}
            {techLevel === "medium" && (
              <>
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <Image
                    src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32"
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4"
                  />
                  Claude Code
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu colles le prompt, Claude génère tout et t&apos;explique chaque étape. Parfait
                  pour monter en compétence.
                </p>
              </>
            )}
            {techLevel === "high" && (
              <>
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <Image
                    src="https://www.google.com/s2/favicons?domain=cursor.sh&sz=32"
                    alt=""
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4"
                  />
                  Cursor
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu gardes le contrôle total du code, Cursor accélère. Le combo le plus puissant
                  pour un dev expérimenté.
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function ToolCardsAccordion({
  selectedTool,
  onSelectTool,
}: {
  selectedTool: ToolOption;
  onSelectTool: (tool: ToolOption) => void;
}) {
  return (
    <details className="rounded-xl border border-border bg-card">
      <summary className="cursor-pointer px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground">
        Choisir et ouvrir votre outil
      </summary>
      <div className="grid grid-cols-1 gap-3 border-t border-border p-4 md:grid-cols-3">
        {TOOLS.map((tool) => (
          <div
            key={tool.key}
            className={cn(
              "rounded-xl border bg-card p-4 transition-all",
              selectedTool === tool.key
                ? "border-blue-500/50 ring-1 ring-blue-500/20"
                : "border-border",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectTool(tool.key)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={tool.favicon}
                    alt={tool.name}
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <p className="truncate text-sm font-semibold text-foreground">{tool.name}</p>
              </button>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={`Ouvrir ${tool.name}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className={cn("mb-2 text-xs font-medium", tool.levelColor)}>{tool.level}</p>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
            <p className="text-xs text-muted-foreground/60">{tool.instruction}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Durée estimée : {tool.time}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function ValidationBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <details className="rounded-lg border border-purple-500/20 bg-purple-950/10">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm text-foreground">
          <BadgeCheck className="h-4 w-4 shrink-0 text-purple-400" />
          Prompt validé par notre équipe
        </summary>
        <p className="border-t border-purple-500/10 px-4 py-2 text-xs text-muted-foreground">
          Testé sur Claude Code · Cursor · v0 — génère un MVP fonctionnel en ~4h
        </p>
      </details>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3">
      <Zap className="h-5 w-5 shrink-0 text-purple-400" />
      <div>
        <p className="text-sm font-semibold text-foreground">Prompt validé par notre équipe</p>
        <p className="text-xs text-muted-foreground">
          Testé sur Claude Code · Cursor · v0 — génère un MVP fonctionnel en ~4h
        </p>
      </div>
    </div>
  );
}

interface ClaudePromptSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
  variant?: "detail" | "playbook";
  builderStage?: BuilderStage;
  stickyTerminal?: boolean;
}

export function ClaudePromptSection({
  opportunity,
  animationIndex,
  variant = "detail",
  builderStage,
  stickyTerminal = false,
}: ClaudePromptSectionProps) {
  const { tier } = useTier();
  const unlocked = hasTier(tier, "builder") && Boolean(opportunity.claudePrompt);
  const isPlaybook = variant === "playbook";
  const sectionClass = cn(isPlaybook ? "mb-0" : "mb-12 scroll-mt-24");
  const titleVariant = isPlaybook ? "playbook" : "detail";
  const sectionNumber = isPlaybook ? 1 : 8;
  const promptSubtitle = isPlaybook
    ? "Colle dans Claude Code, Cursor ou v0 — MVP en une session"
    : undefined;
  const title = "Prompt MVP";

  const terminalRef = useRef<HTMLDivElement>(null);
  const [techLevel, setTechLevel] = useState<TechLevel | null>("medium");
  const [selectedTool, setSelectedTool] = useState<ToolOption>("Claude Code");

  const stack = getRecommendedStack(opportunity);
  const promptText = getPromptForTool(opportunity, selectedTool);
  const quizDefaultOpen = builderStage !== "building";

  const handleTechLevel = (level: TechLevel) => {
    setTechLevel(level);
    setSelectedTool(TECH_LEVEL_TOOLS[level]);
    terminalRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectTool = (tool: ToolOption) => {
    setSelectedTool(tool);
    if (tool === "v0") setTechLevel("none");
    else if (tool === "Cursor") setTechLevel("high");
    else setTechLevel("medium");
  };

  const renderPromptBlock = () => (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <ToolSelector selectedTool={selectedTool} onSelect={handleSelectTool} />
        {isPlaybook ? <CopyButton text={promptText} variant="primary" /> : null}
      </div>

      {selectedTool === "v0" ? (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-foreground">
          Ce prompt génère l&apos;UI uniquement — branchez le backend avec Claude Code ensuite.
        </div>
      ) : null}

      <div ref={terminalRef} className="relative scroll-mt-4">
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-gray-700 dark:border-gray-700",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3 dark:border-gray-700 dark:bg-gray-800",
              stickyTerminal && "sticky top-0 z-10",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex shrink-0 gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <span className="ml-2 shrink-0 text-xs text-muted-foreground">prompt.txt</span>
              {stack.length > 0 ? (
                <div className="ml-2 hidden min-w-0 flex-wrap gap-1 sm:flex">
                  {stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="truncate rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <CopyButton text={promptText} />
          </div>

          <div className="overflow-x-auto bg-gray-950 p-6 dark:bg-gray-950">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">
              {promptText}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Stack recommandée
        </p>
        <div className="flex flex-wrap gap-2">
          {stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-foreground/80"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  const renderGuidance = (compact: boolean) => (
    <div className="mt-4 space-y-4">
      <ValidationBanner compact={compact} />
      <TechLevelQuiz
        techLevel={techLevel}
        onSelectLevel={handleTechLevel}
        defaultOpen={quizDefaultOpen}
      />
      <ToolCardsAccordion selectedTool={selectedTool} onSelectTool={handleSelectTool} />
    </div>
  );

  const renderDetailLayout = () => (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        Colle ce prompt dans Claude Code, Cursor ou v0 — ton MVP démarre en une session
      </p>
      <ValidationBanner />
      <TechLevelQuiz
        techLevel={techLevel}
        onSelectLevel={handleTechLevel}
        defaultOpen
      />
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {TOOLS.map((tool) => (
          <div
            key={tool.key}
            className={cn(
              "group rounded-xl border bg-card p-4 transition-all",
              selectedTool === tool.key
                ? "border-blue-500/50"
                : "border-border hover:border-border",
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectTool(tool.key)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={tool.favicon}
                    alt={tool.name}
                    width={16}
                    height={16}
                    unoptimized
                    className="h-4 w-4"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-blue-400">
                  {tool.name}
                </p>
              </button>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/60 transition-colors hover:text-blue-400"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className={cn("mb-2 text-xs font-medium", tool.levelColor)}>{tool.level}</p>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
            <p className="text-xs text-muted-foreground/60">{tool.instruction}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Durée estimée : {tool.time}</p>
          </div>
        ))}
      </div>
      {renderPromptBlock()}
    </>
  );

  const renderPlaybookLayout = () => (
    <>
      {renderPromptBlock()}
      {renderGuidance(true)}
    </>
  );

  const innerContent = isPlaybook ? renderPlaybookLayout() : renderDetailLayout();

  if (!unlocked) {
    return (
      <AnimatedSection id="prompt" animationIndex={animationIndex} className={sectionClass}>
        <SectionTitle
          number={sectionNumber}
          title={title}
          subtitle={promptSubtitle}
          variant={titleVariant}
        />
        <PaywallGate
          requiredTier="builder"
          preview="Prompt prêt à coller pour générer votre MVP en une session avec Claude Code, Cursor ou v0."
          message="Débloquez le prompt prêt à coller dans Claude Code, Cursor ou v0 avec le plan Builder."
        >
          <div className="space-y-4 opacity-90">
            <div className="overflow-hidden rounded-xl border border-gray-700">
              <div className="border-b border-gray-700 bg-gray-800 px-4 py-3">
                <span className="text-xs text-muted-foreground">prompt.txt</span>
              </div>
              <div className="bg-gray-950 p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                  {PAYWALL_PLACEHOLDER}
                </pre>
              </div>
            </div>
          </div>
        </PaywallGate>
      </AnimatedSection>
    );
  }

  return (
    <AnimatedSection id="prompt" animationIndex={animationIndex} className={sectionClass}>
      <SectionTitle
        number={sectionNumber}
        title={title}
        subtitle={promptSubtitle}
        variant={titleVariant}
      />
      <PaywallGate requiredTier="builder">{innerContent}</PaywallGate>
    </AnimatedSection>
  );
}
