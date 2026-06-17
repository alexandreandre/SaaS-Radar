"use client";

import { ExternalLink, Terminal } from "lucide-react";
import type { BuildTool } from "@/lib/build/tools";
import {
  getDeployPromptSteps,
  isAgentDrivenDeploy,
} from "@/lib/build/deploy-prompts";
import { BuildCopyPrompt } from "@/components/cockpit/build/build-copy-prompt";
import { BuildPlatformLogo, BuildToolLogo } from "@/components/cockpit/build/build-tool-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { EnvVarSpec } from "@/lib/build/infra-profile";

type BuildDeployGuideProps = {
  tool: BuildTool;
  productName: string;
  defaultOpen?: boolean;
  expectedEnvVars?: EnvVarSpec[];
};

const BUILTIN_STEPS: Record<string, string[]> = {
  base44: [
    "Ouvrez votre projet dans Base44.",
    "Vérifiez que le MVP fonctionne en preview.",
    "Cliquez sur Publish en haut à droite.",
    "Choisissez un sous-domaine gratuit ou votre domaine.",
    "Partagez l'URL à vos premiers bêta-testeurs.",
  ],
  lovable: [
    "Ouvrez votre projet Lovable.",
    "Testez le parcours principal (inscription → action clé).",
    "Cliquez sur Publish pour mettre en ligne.",
    "Vérifiez l'URL sur mobile.",
  ],
  v0: [
    "Dans v0, cliquez sur Deploy.",
    "Connectez Vercel si demandé.",
    "Votre URL de production est prête en quelques secondes.",
  ],
  replit: [
    "Ouvrez l'onglet Deployments dans Replit.",
    "Cliquez sur Deploy (Autoscale recommandé).",
    "Testez l'URL .replit.app — parcours inscription.",
  ],
};

export function BuildDeployGuide({
  tool,
  productName,
  defaultOpen = false,
  expectedEnvVars = [],
}: BuildDeployGuideProps) {
  const agentDriven = isAgentDrivenDeploy(tool);
  const promptSteps = agentDriven ? getDeployPromptSteps(tool, productName, expectedEnvVars) : [];
  const builtinSteps = BUILTIN_STEPS[tool.id];

  return (
    <details
      className="rounded-xl border border-border bg-card shadow-card"
      open={defaultOpen || undefined}
    >
      <summary className="cursor-pointer list-none px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <BuildToolLogo toolId={tool.id} size="sm" />
          <div>
            <span className="font-medium">
              Mettre mon app en ligne avec {tool.name}
            </span>
            {agentDriven ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                GitHub puis Vercel — interfaces web en priorité.
              </p>
            ) : null}
          </div>
        </div>
      </summary>

      <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
        {agentDriven ? (
          <>
            <p className="text-sm text-muted-foreground">
              GitHub et Vercel se font depuis leurs interfaces web — les prompts Cursor sont là
              si vous bloquez.
            </p>

            <ol className="space-y-5">
              {promptSteps.map((step, index) => (
                <li key={step.id} className="space-y-2">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="font-medium text-foreground">{step.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{step.summary}</p>
                      </div>
                      {step.manualSteps?.length ? (
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <p className="text-xs font-medium text-foreground">
                            {step.id === "github"
                              ? "Depuis l'interface GitHub + Cursor"
                              : "Depuis l'interface Vercel"}
                          </p>
                          <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                            {step.manualSteps.map((line, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="shrink-0 font-medium text-primary">{i + 1}.</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ol>
                          {step.manualLink ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 h-8 gap-1.5 text-xs"
                              asChild
                            >
                              <a
                                href={step.manualLink.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {step.manualPlatform ? (
                                  <BuildPlatformLogo
                                    platform={step.manualPlatform}
                                    size="sm"
                                    variant="inline"
                                  />
                                ) : null}
                                {step.manualLink.label}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      ) : null}

                      <BuildCopyPrompt
                        label={
                          step.manualSteps?.length
                            ? `Ou demandez à ${tool.name}`
                            : `Prompt pour ${tool.name}`
                        }
                        text={step.cursorPrompt}
                        compact
                      />
                      {step.terminalCommands?.length ? (
                        <details className="rounded-lg border border-dashed border-border/80 bg-muted/10">
                          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                            <Terminal className="h-3.5 w-3.5" />
                            Commandes terminal (si besoin)
                          </summary>
                          <pre className="overflow-x-auto border-t border-border/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                            {step.terminalCommands.join("\n")}
                          </pre>
                        </details>
                      ) : null}
                      {step.envHint || step.envVars?.length ? (
                        <details className="rounded-lg border border-dashed border-border/80 bg-muted/10">
                          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                            Variables d&apos;environnement
                          </summary>
                          <div className="border-t border-border/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                            {step.envVars?.length ? (
                              <ul className="space-y-2">
                                {step.envVars.map((envVar) => (
                                  <li key={envVar.name}>
                                    <p className="font-mono font-medium text-foreground">
                                      {envVar.name}
                                    </p>
                                    <p>{envVar.role}</p>
                                    <p className="text-muted-foreground/80">{envVar.where}</p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="whitespace-pre-wrap">{step.envHint}</p>
                            )}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <ol className="space-y-3">
            {(builtinSteps ?? [
              `Ouvrez ${tool.name} et utilisez le bouton Publish.`,
              "Testez en preview avant de partager.",
              "Envoyez l'URL à 5 prospects.",
            ]).map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary",
                  )}
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
