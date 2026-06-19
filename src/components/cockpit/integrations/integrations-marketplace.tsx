"use client";

import { useMemo, useState } from "react";
import { CONNECTOR_JOB_LABELS, CONNECTORS } from "@/lib/connectors/registry";
import type { ConnectorId, Integration } from "@/lib/connectors/types";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import type { GitHubTrackedRepo } from "@/lib/portfolio";
import { IntegrationCard } from "@/components/cockpit/integrations/integration-card";
import { cn } from "@/lib/utils";
import type { ConnectIntegrationOptions } from "@/contexts/portfolio-context";

type IntegrationsMarketplaceProps = {
  projectId: string;
  integrations: Integration[];
  githubTrackedRepos?: GitHubTrackedRepo[];
  githubStream?: ConnectorStreamPayload;
  onConnect: (id: ConnectorId, options?: ConnectIntegrationOptions) => Promise<void>;
  onSync: (id: ConnectorId) => Promise<void>;
  onDisconnect: (id: ConnectorId) => Promise<void>;
  onPatch: (id: ConnectorId, patch: Partial<Integration>) => void;
};

export function IntegrationsMarketplace({
  projectId,
  integrations,
  githubTrackedRepos = [],
  githubStream,
  onConnect,
  onSync,
  onDisconnect,
  onPatch,
}: IntegrationsMarketplaceProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "p0" | "p1" | "p2">("all");

  const filtered = useMemo(() => {
    return CONNECTORS.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [search, priorityFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof CONNECTORS>();
    for (const job of CONNECTOR_JOB_LABELS) {
      map.set(job, filtered.filter((c) => c.jobLabel === job));
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Rechercher une intégration…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 min-w-[200px] flex-1 rounded-lg border border-input bg-background px-3 text-sm"
        />
        <div className="flex gap-1">
          {(["all", "p0", "p1", "p2"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                priorityFilter === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted",
              )}
            >
              {p === "all" ? "Tous" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {CONNECTOR_JOB_LABELS.map((job) => {
        const connectors = grouped.get(job) ?? [];
        if (connectors.length === 0) return null;

        return (
          <section key={job}>
            <h3 className="mb-3 font-semibold">{job}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {connectors.map((connector) => {
                const integration = integrations.find((i) => i.connectorId === connector.id);
                return (
                  <IntegrationCard
                    key={connector.id}
                    projectId={projectId}
                    connector={connector}
                    integration={integration}
                    githubTrackedRepos={githubTrackedRepos}
                    githubStream={githubStream}
                    onConnect={onConnect}
                    onSync={onSync}
                    onDisconnect={onDisconnect}
                    onPatch={onPatch}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
