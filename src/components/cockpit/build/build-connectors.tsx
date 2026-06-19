"use client";

import { Plug } from "lucide-react";
import { ConnectorLogo } from "@/components/cockpit/integrations/connector-logo";
import { BuildPlatformName } from "@/components/cockpit/build/build-tool-logo";
import { StatCard } from "@/components/cockpit/ui/module-primitives";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";
import {
  getGitHubPrimaryRepoStream,
  getGitHubStreamsList,
  isGitHubMultiStream,
  normalizeGitHubStreamPayload,
} from "@/lib/connectors/streams";

type BuildConnectorsProps = Pick<
  CockpitModuleProps,
  "project" | "opportunity" | "onModuleChange"
>;

function aggregateGitHubStats(githubStream: ReturnType<typeof normalizeGitHubStreamPayload>) {
  const streams = githubStream ? getGitHubStreamsList(githubStream) : [];
  if (streams.length === 0) return null;

  const deploysLast30d = streams.reduce((s, r) => s + (r.deploysLast30d ?? 0), 0);
  const openIssues = streams.reduce((s, r) => s + (r.openIssues ?? 0), 0);
  const uptimeValues = streams.map((r) => r.uptimePct).filter((v) => v != null);
  const uptimePct =
    uptimeValues.length > 0
      ? Math.round((uptimeValues.reduce((a, b) => a + b, 0) / uptimeValues.length) * 10) / 10
      : 0;

  const primary = getGitHubPrimaryRepoStream(githubStream ?? undefined);
  const label =
    streams.length > 1
      ? `${streams.length} dépôts`
      : primary?.repoFullName ?? "GitHub";

  return { deploysLast30d, openIssues, uptimePct, label };
}

export function BuildConnectors({
  project,
  opportunity,
  onModuleChange,
}: BuildConnectorsProps) {
  const githubPayload = project.connectorStreams?.github;
  const githubMulti = normalizeGitHubStreamPayload(githubPayload);
  const githubStats = aggregateGitHubStats(githubMulti);
  const sentryStream = project.connectorStreams?.sentry;
  const vercelStream = project.connectorStreams?.vercel;
  const infraCost = opportunity.infraCosts?.reduce((s, c) => s + c.estimate, 0) ?? 0;

  const hasAnyConnector =
    Boolean(githubMulti) ||
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
            {githubStats ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  GitHub · {githubStats.label}
                  {isGitHubMultiStream(githubMulti) && githubMulti?.primaryRepoFullName
                    ? ` · principal ${githubMulti.primaryRepoFullName}`
                    : null}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="Deploys (30j)" value={String(githubStats.deploysLast30d)} />
                  <StatCard label="Issues ouvertes" value={String(githubStats.openIssues)} />
                  <StatCard label="Uptime moy." value={`${githubStats.uptimePct} %`} />
                </div>
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
