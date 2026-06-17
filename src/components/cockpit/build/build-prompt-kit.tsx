"use client";

import { useRef, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { BuilderStage } from "@/lib/build-launch";
import { resolveBuildPrompts } from "@/lib/build-recipe";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Button } from "@/components/ui/button";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";
import { cn } from "@/lib/utils";

const TOOL_OPTIONS = ["Claude Code", "Cursor", "v0"] as const;
type ToolOption = (typeof TOOL_OPTIONS)[number];

const PAYWALL_PLACEHOLDER = `Build a modern SaaS application for the French market.

Stack: Next.js 14, Supabase, Stripe, Tailwind CSS
Pages: Landing, Dashboard, Settings, Billing

Implement authentication, subscription billing, and core workflow features.`;

function variantPrompt(base: string, tool: ToolOption, opportunity: Opportunity): string {
  if (tool === "Claude Code") return base;
  if (tool === "Cursor") {
    return `${base}\n\n---\nContext: Use Cursor Composer with @codebase. Create files sequentially. Confirm at each major step.`;
  }
  return `Build a landing + dashboard UI for "${opportunity.name}":\n${base.split("\n").slice(0, 10).join("\n")}\n\nUse shadcn, Tailwind, French copy. UI only — backend separately.`;
}

function CopyButton({ text, primary }: { text: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (primary) {
    return (
      <Button type="button" size="sm" className="gap-2" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copié !" : "Copier"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

type BuildPromptKitProps = {
  opportunity: Opportunity;
  builderStage?: BuilderStage;
};

export function BuildPromptKit({ opportunity, builderStage }: BuildPromptKitProps) {
  const { tier } = useTier();
  const unlocked = hasTier(tier, "builder") && Boolean(opportunity.claudePrompt);
  const kit = resolveBuildPrompts(opportunity);
  const [selectedTool, setSelectedTool] = useState<ToolOption>("Claude Code");
  const [activeTab, setActiveTab] = useState<"scaffold" | number>("scaffold");
  const terminalRef = useRef<HTMLDivElement>(null);

  const scaffoldText = kit
    ? variantPrompt(kit.scaffold, selectedTool, opportunity)
    : PAYWALL_PLACEHOLDER;
  const featurePrompt =
    typeof activeTab === "number" && kit?.features[activeTab]
      ? variantPrompt(kit.features[activeTab].prompt, selectedTool, opportunity)
      : scaffoldText;
  const displayText = activeTab === "scaffold" ? scaffoldText : featurePrompt;

  const content = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Outil :</p>
        {TOOL_OPTIONS.map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => setSelectedTool(tool)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs transition-colors",
              selectedTool === tool
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {tool}
          </button>
        ))}
      </div>

      {kit && kit.features.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("scaffold")}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs",
              activeTab === "scaffold"
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            Scaffold initial
          </button>
          {kit.features.map((f, i) => (
            <button
              key={f.feature}
              type="button"
              onClick={() => setActiveTab(i)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs",
                activeTab === i
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {f.feature}
            </button>
          ))}
        </div>
      ) : null}

      <div ref={terminalRef} className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">prompt.txt</span>
          <CopyButton text={displayText} primary />
        </div>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap bg-muted/20 p-4 font-mono text-xs leading-relaxed">
          {displayText}
        </pre>
      </div>

      <p className="text-xs text-muted-foreground">
        {builderStage === "starting"
          ? "Commencez par le scaffold, puis un prompt par feature."
          : "Adaptez le prompt à l'étape en cours dans la roadmap."}
      </p>
    </div>
  );

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-primary">Prompts IA</p>
          <h3 className="mt-1 text-lg font-semibold">Kit de build séquencé</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Collez dans Claude Code, Cursor ou v0 — un prompt par étape.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer">
            Ouvrir Claude Code
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>

      {!unlocked ? (
        <PaywallGate
          requiredTier="builder"
          preview="Prompts scaffold + features prêts à coller pour générer votre MVP."
          message="Débloquez le kit de prompts avec le plan Builder."
        >
          <div className="rounded-xl border border-border bg-muted/20 p-4 opacity-90">
            <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
              {PAYWALL_PLACEHOLDER}
            </pre>
          </div>
        </PaywallGate>
      ) : (
        content
      )}
    </section>
  );
}
