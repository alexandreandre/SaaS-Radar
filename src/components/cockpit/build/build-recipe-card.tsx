"use client";

import { useCallback, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import type { BuildSetup } from "@/lib/portfolio";
import type { BuildTool } from "@/lib/build/tools";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { Button } from "@/components/ui/button";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";
import { cn } from "@/lib/utils";

type BuildRecipeCardProps = {
  tool: BuildTool;
  opportunitySlug: string;
  setup?: BuildSetup;
  loading?: boolean;
  onGenerated: (setup: BuildSetup) => void;
  onRegenerate: () => void;
};

type TabId = "prompt" | "recipe" | "quick";

function CopyBlock({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button type="button" size="sm" variant="ghost" className="h-7 gap-1.5" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

export function BuildRecipeCard({
  tool,
  opportunitySlug,
  setup,
  loading = false,
  onGenerated,
  onRegenerate,
}: BuildRecipeCardProps) {
  const { tier } = useTier();
  const unlocked = hasTier(tier, "builder");
  const [tab, setTab] = useState<TabId>("prompt");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (mode: "mvp" | "regenerate" = "mvp") => {
      setGenerating(true);
      setError(null);
      try {
        const res = await fetch("/api/build/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opportunitySlug, toolId: tool.id, mode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur de génération");
        const next: BuildSetup = {
          toolId: tool.id,
          mvpPrompt: data.mvpPrompt,
          setupRecipe: data.setupRecipe,
          quickStart: data.quickStart,
          generatedAt: data.generatedAt,
        };
        onGenerated(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setGenerating(false);
      }
    },
    [opportunitySlug, tool.id, onGenerated],
  );

  const busy = loading || generating;

  const tabs: { id: TabId; label: string; content?: string }[] = [
    { id: "prompt", label: "Prompt MVP", content: setup?.mvpPrompt },
    { id: "recipe", label: "Recette setup", content: setup?.setupRecipe },
    { id: "quick", label: "Démarrage rapide", content: setup?.quickStart },
  ];

  const active = tabs.find((t) => t.id === tab);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
            Généré pour {tool.name}
          </p>
          <h3 className="mt-1 text-lg font-semibold">Votre kit de démarrage</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={tool.deepLink} target="_blank" rel="noopener noreferrer">
              Ouvrir {tool.name}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          {setup ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => {
                onRegenerate();
                void generate("regenerate");
              }}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
              Régénérer
            </Button>
          ) : null}
        </div>
      </div>

      {!unlocked ? (
        <PaywallGate
          requiredTier="builder"
          preview="Prompt MVP + recette de setup générés par IA pour votre opportunité."
          message="Débloquez la génération de prompt avec le plan Builder."
        >
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sélectionnez un outil puis générez votre kit personnalisé.
          </div>
        </PaywallGate>
      ) : !setup ? (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Générez un prompt MVP adapté à {tool.name} et à votre opportunité.
          </p>
          <Button
            type="button"
            className="mt-4 gap-2"
            disabled={busy}
            onClick={() => void generate("mvp")}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Générer mon kit MVP
          </Button>
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                  tab === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {active?.content ? (
            <CopyBlock text={active.content} label={active.label} />
          ) : null}
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </>
      )}
    </section>
  );
}
