"use client";

import { Plug } from "lucide-react";
import { ConnectorLogo } from "@/components/cockpit/integrations/connector-logo";
import { BuildPlatformName } from "@/components/cockpit/build/build-tool-logo";
import { StatCard } from "@/components/cockpit/ui/module-primitives";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

type BuildConnectorsProps = Pick<
  CockpitModuleProps,
  "project" | "opportunity" | "onModuleChange"
>;

export function BuildConnectors({
  project,
  opportunity,
  onModuleChange,
}: BuildConnectorsProps) {
  const githubStream = project.connectorStreams?.github;
  const sentryStream = project.connectorStreams?.sentry;
  const vercelStream = project.connectorStreams?.vercel;
  const infraCost = opportunity.infraCosts?.reduce((s, c) => s + c.estimate, 0) ?? 0;

  const hasAnyConnector =
    githubStream?.type === "dev" ||
    sentryStream?.type === "dev" ||
    vercelStream?.type === "dev";

  return (
    <details className="rounded-xl border border-border bg-card shadow-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <Plug className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Connecteurs dev (optionnel)</span>
        {!hasAnyConnector ? (
          <span className="ml-auto text-xs text-muted-foreground">Non connecté</span>
        ) : null}
      </summary>

      <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
        {!hasAnyConnector ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Connectez <BuildPlatformName platform="github" size="xs" />, Sentry ou{" "}
              <BuildPlatformName platform="vercel" size="xs" /> pour suivre deploys, erreurs et
              uptime ici.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onModuleChange("integrations")}
            >
              Ouvrir les connecteurs
            </Button>
          </div>
        ) : (
          <>
            {githubStream?.type === "dev" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Deploys (30j)" value={String(githubStream.deploysLast30d)} />
                <StatCard label="Issues ouvertes" value={String(githubStream.openIssues)} />
                <StatCard label="Uptime" value={`${githubStream.uptimePct} %`} />
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              {sentryStream?.type === "dev" ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <ConnectorLogo connectorId="sentry" size="sm" showTile={false} />
                    Sentry
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Taux d&apos;erreur : {sentryStream.errorRate} % · {sentryStream.openIssues}{" "}
                    issues
                  </p>
                </div>
              ) : null}
              {vercelStream?.type === "dev" ? (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <h4 className="flex items-center gap-2 font-semibold">
                    <BuildPlatformName platform="vercel" size="sm" />
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Uptime {vercelStream.uptimePct} % · {vercelStream.deploysLast30d} deploys
                  </p>
                  {infraCost > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Coût infra estimé : {formatCurrency(infraCost)}/mois
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </details>
  );
}
