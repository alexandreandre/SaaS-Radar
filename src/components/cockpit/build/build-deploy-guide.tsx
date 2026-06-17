"use client";

import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { BuildTool } from "@/lib/build/tools";
import { Button } from "@/components/ui/button";

type BuildDeployGuideProps = {
  tool: BuildTool;
  opportunity: Opportunity;
};

const BUILTIN_STEPS: Record<string, string[]> = {
  base44: [
    "Ouvrez votre projet dans Base44.",
    "Vérifiez que le MVP fonctionne en preview.",
    "Cliquez sur **Publish** en haut à droite.",
    "Choisissez un nom de domaine (sous-domaine gratuit ou domaine custom).",
    "Votre app est en ligne — partagez l'URL à vos premiers bêta-testeurs.",
  ],
  lovable: [
    "Ouvrez votre projet Lovable.",
    "Testez le parcours principal (signup → action clé).",
    "Cliquez sur **Publish** pour déployer sur l'hébergement Lovable.",
    "Option avancée : connectez GitHub (Settings → GitHub) puis déployez sur Vercel.",
    "Vérifiez que l'URL de production fonctionne sur mobile.",
  ],
  v0: [
    "Dans v0, cliquez sur **Deploy** — déploiement Vercel automatique.",
    "Connectez votre compte Vercel si demandé.",
    "L'URL de production est générée en quelques secondes.",
    "Pour itérer : modifiez dans v0, re-déployez en 1 clic.",
  ],
  replit: [
    "Dans Replit, ouvrez l'onglet **Deployments**.",
    "Cliquez sur **Deploy** et choisissez le type (Autoscale recommandé).",
    "Attendez la fin du build (2-5 min).",
    "Votre URL `.replit.app` est prête — testez le signup.",
  ],
};

const GITHUB_VERCEL_STEPS = [
  "Exportez ou poussez votre code sur **GitHub** (nouveau repo privé).",
  "Sur [vercel.com](https://vercel.com), cliquez **Add New → Project**.",
  "Importez votre repo GitHub.",
  "Ajoutez les variables d'environnement (clés API, URL base de données).",
  "Cliquez **Deploy** — votre app est en ligne en ~2 min.",
  "Chaque push sur `main` redéploie automatiquement.",
];

export function BuildDeployGuide({ tool, opportunity }: BuildDeployGuideProps) {
  const [deployRecipe, setDeployRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tool.deployModel !== "github-vercel") return;
    setLoading(true);
    void fetch("/api/build/deploy-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunitySlug: opportunity.slug,
        toolId: tool.id,
      }),
    })
      .then((r) => r.json())
      .then((d) => setDeployRecipe(d.markdown ?? null))
      .catch(() => setDeployRecipe(null))
      .finally(() => setLoading(false));
  }, [tool.id, tool.deployModel, opportunity.slug]);

  const staticSteps =
    tool.deployModel === "builtin"
      ? (BUILTIN_STEPS[tool.id] ?? [
          `Ouvrez ${tool.name} et utilisez le bouton Publish intégré.`,
          "Testez votre app en preview avant de publier.",
          "Partagez l'URL à 5 prospects pour valider.",
        ])
      : GITHUB_VERCEL_STEPS;

  const steps = deployRecipe
    ? deployRecipe.split("\n").filter((l) => l.trim())
    : staticSteps;

  return (
    <details className="rounded-xl border border-border bg-card shadow-card">
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Guide de déploiement — {tool.name}</span>
        </div>
      </summary>
      <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Préparation du guide…</p>
        ) : (
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-foreground/90">{step.replace(/^\d+\.\s*/, "")}</span>
              </li>
            ))}
          </ol>
        )}

        {tool.deployModel === "github-vercel" ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recette CI/CD (à coller dans {tool.name})
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Demandez à {tool.name} de créer un fichier{" "}
              <code className="rounded bg-muted px-1">.github/workflows/deploy.yml</code> qui
              build sur chaque push et déploie sur Vercel. Connectez ensuite le repo dans les
              paramètres Vercel.
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                Connecter Vercel
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
