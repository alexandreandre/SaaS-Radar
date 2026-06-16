"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types/opportunity";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

const DEFAULT_STACK = ["Next.js 14", "Supabase", "Stripe", "Tailwind CSS"];

type TechLevel = "none" | "medium" | "high";

const TOOLS = [
  {
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
  const base = opportunity.claudePrompt;

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

interface ClaudePromptSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

export function ClaudePromptSection({ opportunity, animationIndex }: ClaudePromptSectionProps) {
  const [techLevel, setTechLevel] = useState<TechLevel | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("Claude Code");

  // Le prompt est un champ premium (Pro) retire cote serveur pour un tier insuffisant.
  // On affiche alors un teaser de deblocage plutot qu'un bloc vide.
  if (!opportunity.claudePrompt) {
    return (
      <AnimatedSection id="prompt" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
        <SectionTitle number={8} title="Prompt Claude Code" />
        <div className="rounded-xl border border-dashed border-primary/30 bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Prompt complet réservé au plan Pro
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Débloquez le prompt prêt à coller dans Claude Code, Cursor ou v0 pour lancer le MVP en une session.
          </p>
          <a
            href="/pricing"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Passer au plan Pro
          </a>
        </div>
      </AnimatedSection>
    );
  }

  const stack = getRecommendedStack(opportunity);
  const promptText = getPromptForTool(opportunity, selectedTool);

  return (
    <AnimatedSection id="prompt" animationIndex={animationIndex} className="mb-12 scroll-mt-24">
      <SectionTitle number={8} title="Prompt Claude Code" />
      <p className="mb-6 text-sm text-muted-foreground">
        Colle ce prompt dans Claude Code, Cursor ou v0 — ton MVP démarre en une session
      </p>

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3">
        <span className="text-lg text-purple-400">⚡</span>
        <div>
          <p className="text-sm font-semibold text-foreground">Prompt validé par notre équipe</p>
          <p className="text-xs text-muted-foreground">
            Testé sur Claude Code · Cursor · v0 — génère un MVP fonctionnel en ~4h
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
          Quelle plateforme pour toi ?
        </p>
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
              onClick={() => setTechLevel(opt.id)}
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

        {techLevel && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="mb-1 text-xs text-muted-foreground">Notre recommandation</p>
            {techLevel === "none" && (
              <>
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <img
                    src="https://www.google.com/s2/favicons?domain=v0.dev&sz=32"
                    alt=""
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
                  <img
                    src="https://www.google.com/s2/favicons?domain=claude.ai&sz=32"
                    alt=""
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
                  <img
                    src="https://www.google.com/s2/favicons?domain=cursor.sh&sz=32"
                    alt=""
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
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        {TOOLS.map((tool, i) => (
          <a
            key={i}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-border"
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-muted">
                <img
                  src={tool.favicon}
                  alt={tool.name}
                  className="h-4 w-4"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-blue-400">
                {tool.name}
              </p>
              <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground/60 transition-colors group-hover:text-blue-400" />
            </div>
            <p className={cn("mb-2 text-xs font-medium", tool.levelColor)}>{tool.level}</p>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
            <p className="text-xs text-muted-foreground/60">{tool.instruction}</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Durée estimée : {tool.time}</p>
          </a>
        ))}
      </div>

      <div className="relative mb-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">Générer le prompt pour :</p>
          <div className="flex gap-2">
            {["Claude Code", "Cursor", "v0"].map((tool) => (
              <button
                key={tool}
                type="button"
                onClick={() => setSelectedTool(tool)}
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

        <div className="flex items-center justify-between rounded-t-xl border border-gray-700 bg-gray-800 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
            </div>
            <span className="ml-2 text-xs text-muted-foreground">prompt.txt</span>
          </div>
          <CopyButton text={promptText} />
        </div>

        <div className="overflow-x-auto rounded-b-xl border border-t-0 border-gray-700 bg-gray-950 p-6 dark:border-gray-700 dark:bg-gray-950">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">
            {promptText}
          </pre>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Stack recommandée</p>
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
    </AnimatedSection>
  );
}
