"use client";

import { useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

const variants = [
  { id: "claude", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "v0", label: "v0" },
  { id: "replit", label: "Replit" },
] as const;

function variantPrompt(base: string, variant: string): string {
  if (variant === "claude") return base;
  if (variant === "cursor")
    return `${base}\n\n---\nContext: Use Cursor Composer with @codebase. Start with app router structure and shadcn components.`;
  if (variant === "v0")
    return `Build a landing + dashboard UI for:\n${base.split("\n").slice(0, 8).join("\n")}\n\nUse shadcn, Tailwind, French copy.`;
  return `Replit Agent task:\n${base.split("\n").slice(0, 12).join("\n")}\n\nDeploy on Replit with PostgreSQL.`;
}

export function ClaudePromptSection({ opportunity }: { opportunity: Opportunity }) {
  const [variant, setVariant] = useState<string>("claude");
  const text = variantPrompt(opportunity.claudePrompt, variant);

  const content = (
    <div className="rounded-xl border-2 border-primary/30 bg-hero p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-base text-map-muted">
            Ouvrez Claude Code ou Cursor, collez tout le bloc — l&apos;app part de là.
          </p>
        </div>
        <CopyButton
          text={text}
          className="border-map-border bg-card/10 text-hero-foreground hover:bg-card/20"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVariant(v.id)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              variant === v.id
                ? "bg-primary text-primary-foreground"
                : "bg-card/10 text-map-muted hover:text-hero-foreground"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-card/10 p-4 text-sm leading-relaxed text-map-muted">
        {text}
      </pre>
    </div>
  );

  return (
    <SectionShell
      id="prompt"
      step={5}
      title="Prompt Claude Code"
      subtitle="Collez ce texte dans Claude Code, Cursor ou v0 pour générer le MVP"
      requiredTier="pro"
      variant="pro"
    >
      <PaywallGate
        requiredTier="pro"
        preview={
          <p className="text-base">
            Prompt complet + variantes Cursor, v0 et Replit — prêt à copier-coller
          </p>
        }
        message="Débloquez le prompt pour lancer le développement en une session"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}
