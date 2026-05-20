"use client";

import { useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import { SectionShell } from "@/components/opportunities/detail/section-shell";
import { PaywallGate } from "@/components/billing/paywall-gate";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

const integrations = [
  { name: "Stripe", desc: "Encaisser les abonnements", status: "Recommandé" },
  { name: "Google Calendar", desc: "Sync des rendez-vous", status: "Optionnel" },
  { name: "Doctolib", desc: "Prise de RDV (secteur santé)", status: "Si santé" },
  { name: "Resend", desc: "Emails automatiques", status: "Recommandé" },
];

const promptTabs = [
  { id: "claude", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "v0", label: "v0 (interface)" },
] as const;

function variantPrompt(base: string, variant: string): string {
  if (variant === "claude") return base;
  if (variant === "cursor")
    return `${base}\n\n---\nÀ utiliser dans Cursor : décrivez le dossier @codebase et demandez de créer l'app étape par étape.`;
  return `Créez l'interface et la landing avec v0 :\n${base.split("\n").slice(0, 10).join("\n")}`;
}

export function StartKit({ opportunity }: { opportunity: Opportunity }) {
  const [variant, setVariant] = useState<string>("claude");
  const templates = opportunity.emailTemplates ?? [];
  const partners = opportunity.partnersFR ?? [];
  const promptText = variantPrompt(opportunity.claudePrompt, variant);

  const content = (
    <div className="space-y-12">
      <div className="rounded-xl border-2 border-primary/30 bg-hero p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-hero-foreground">1. Collez ce texte dans votre IA</h3>
            <p className="mt-2 text-base text-map-muted">
              Ouvrez Claude Code ou Cursor, collez tout le bloc — l&apos;app part de là.
            </p>
          </div>
          <CopyButton
            text={promptText}
            className="border-map-border bg-card/10 text-hero-foreground hover:bg-card/20"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {promptTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setVariant(t.id)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                variant === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/10 text-map-muted hover:text-hero-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-card/10 p-4 text-sm leading-relaxed text-map-muted whitespace-pre-wrap">
          {promptText}
        </pre>
      </div>

      <div>
        <h3 className="text-xl font-semibold">2. Emails prêts à envoyer</h3>
        <p className="mt-2 text-base text-muted-foreground">Copiez, personnalisez le prénom, envoyez.</p>
        <div className="mt-6 space-y-4">
          {templates.map((t) => (
            <div key={t.name} className="rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold">{t.name}</p>
                <CopyButton text={`Objet: ${t.subject}\n\n${t.body}`} />
              </div>
              <p className="mt-2 text-base text-muted-foreground">Objet : {t.subject}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold">3. Partenaires à contacter en France</h3>
        <ul className="mt-6 space-y-4">
          {partners.map((p) => (
            <li key={p.name} className="flex flex-col gap-1 rounded-lg border border-border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.type}</p>
              </div>
              <p className="text-base text-primary sm:max-w-xs sm:text-right">{p.angle}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold">4. Branchements utiles</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {integrations.map((int) => (
            <div
              key={int.name}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-5 py-4"
            >
              <div>
                <p className="font-semibold">{int.name}</p>
                <p className="text-sm text-muted-foreground">{int.desc}</p>
              </div>
              <span className="text-xs font-medium text-primary">{int.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <SectionShell
      id="demarrer"
      step={6}
      title="Tout pour démarrer maintenant"
      subtitle="Prompt, emails, contacts et outils — prêt à l'emploi"
      requiredTier="pro"
      variant="pro"
    >
      <PaywallGate
        requiredTier="pro"
        preview={
          <p className="text-base">
            Prompt à coller · {templates.length} emails · {partners.length} partenaires · branchements conseillés
          </p>
        }
        message="Passez en Pro pour copier le prompt et lancer sans préparation"
      >
        {content}
      </PaywallGate>
    </SectionShell>
  );
}
