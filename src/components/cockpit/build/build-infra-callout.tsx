"use client";

import { ChevronDown, Database, ExternalLink, KeyRound } from "lucide-react";
import type { EnvVarSpec, InfraService, PrimaryBackend } from "@/lib/build/infra-profile";
import type { BuildToolId } from "@/lib/build/tools";
import { getBuildTool } from "@/lib/build/tools";
import {
  INFRA_PROVIDER_LINKS,
  inferInfraProvidersFromEnvVars,
  type InfraBrandId,
} from "@/lib/build/brands";
import { BuildInfraLogo, BuildInfraName } from "@/components/cockpit/build/build-tool-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuildInfraCalloutProps = {
  summary: string;
  services: InfraService[];
  envVars: EnvVarSpec[];
  setupSteps?: string[];
  primaryBackend?: PrimaryBackend;
  activeToolId: BuildToolId;
  otherToolIds?: BuildToolId[];
  className?: string;
};

function resolveInfraProviders(
  envVars: EnvVarSpec[],
  primaryBackend?: PrimaryBackend,
): InfraBrandId[] {
  const fromEnv = inferInfraProvidersFromEnvVars(envVars.map((v) => v.name));
  if (fromEnv.length > 0) return fromEnv;
  if (primaryBackend === "supabase") return ["supabase"];
  if (primaryBackend === "firebase") return ["firebase"];
  return [];
}

const INFRA_LOGOS_PER_ROW = 3;

function chunkInfraProviders<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function InfraProviderLogos({ providers }: { providers: InfraBrandId[] }) {
  if (providers.length === 0) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300">
        <Database className="h-4 w-4" />
      </div>
    );
  }

  const rows = chunkInfraProviders(providers, INFRA_LOGOS_PER_ROW);

  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-1.5">
          {row.map((provider) => (
            <BuildInfraLogo key={provider} brandId={provider} size="sm" className="shrink-0" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function BuildInfraCallout({
  summary,
  services,
  envVars,
  setupSteps = [],
  primaryBackend,
  activeToolId,
  otherToolIds = [],
  className,
}: BuildInfraCalloutProps) {
  if (services.length === 0) return null;

  const hasLovableKit =
    activeToolId !== "lovable" &&
    otherToolIds.includes("lovable");

  const providers = resolveInfraProviders(envVars, primaryBackend);

  return (
    <section
      className={cn(
        "rounded-xl border border-sky-500/25 bg-sky-500/[0.05] p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <InfraProviderLogos providers={providers} />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-sky-700/80 dark:text-sky-300/80">
              Infra nécessaire pour ce MVP
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{summary}</p>
          </div>

          {setupSteps.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avant de coller le prompt</p>
              <ol className="mt-1.5 space-y-1 text-sm text-foreground/90">
                {setupSteps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 text-sky-600">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {envVars.length > 0 ? (
            <details className="group rounded-lg border border-border/70 bg-muted/10">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
                <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                  Variables à prévoir (.env.example)
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {envVars.length} clé{envVars.length > 1 ? "s" : ""}
                </span>
              </summary>
              <ul className="space-y-1.5 border-t border-border/60 px-3 py-2.5">
                {envVars.map((envVar) => (
                  <li
                    key={envVar.name}
                    className="rounded-md border border-border/60 bg-background/70 px-2.5 py-2 text-xs"
                  >
                    <p className="font-mono font-medium text-foreground">{envVar.name}</p>
                    <p className="mt-0.5 text-muted-foreground">{envVar.role}</p>
                    <p className="mt-0.5 text-muted-foreground/80">{envVar.where}</p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {providers.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {providers.map((provider) => {
                const link = INFRA_PROVIDER_LINKS[provider];
                return (
                  <Button
                    key={provider}
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    asChild
                  >
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      <BuildInfraLogo brandId={provider} size="xs" variant="inline" />
                      {link.labelFr}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {hasLovableKit ? (
        <p className="mt-3 border-t border-sky-500/15 pt-3 text-xs leading-relaxed text-muted-foreground">
          Préférez zéro config backend ? Basculez sur le kit{" "}
          <span className="font-medium text-foreground/80">
            {getBuildTool("lovable")?.name ?? "Lovable"}
          </span>{" "}
          via les chips ci-dessus — auth et BDD via{" "}
          <BuildInfraName brandId="supabase" size="xs" className="mx-0.5" /> incluses.
        </p>
      ) : null}
    </section>
  );
}
