"use client";

import { useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { generateDemoClients } from "@/lib/connectors/demo/clients-generator";
import { ChartSection, StatCard } from "@/components/cockpit/ui/module-primitives";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function ClientsModule({ project, data }: CockpitModuleProps) {
  const supportStream =
    project.connectorStreams?.crisp ??
    project.connectorStreams?.intercom ??
    project.connectorStreams?.zendesk;
  const crmStream =
    project.connectorStreams?.hubspot ?? project.connectorStreams?.pipedrive;

  const clients = useMemo(
    () => generateDemoClients(project.id, 12),
    [project.id]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients actifs" value={String(data.metrics.latest?.customers ?? 0)} />
        {supportStream?.type === "support" ? (
          <>
            <StatCard label="Tickets ouverts" value={String(supportStream.openTickets)} />
            <StatCard label="Temps réponse" value={`${supportStream.avgResponseHours} h`} />
            <StatCard label="CSAT" value={`${supportStream.csat} %`} />
          </>
        ) : (
          <>
            <StatCard label="Tickets" value="—" />
            <StatCard label="CSAT" value="—" />
            <StatCard label="Churn" value={`${data.metrics.churnRate} %`} />
          </>
        )}
      </div>

      {crmStream?.type === "crm" ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Pipeline" value={formatCurrency(crmStream.pipelineValue)} />
          <StatCard label="Deals gagnés" value={String(crmStream.dealsWon)} />
          <StatCard label="Deals perdus" value={String(crmStream.dealsLost)} />
          <StatCard label="Cycle moyen" value={`${crmStream.avgCycleDays} j`} />
        </div>
      ) : null}

      <ChartSection title="Portefeuille clients (synthèse)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2">Client</th>
                <th className="pb-2">MRR</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Health</th>
                <th className="pb-2">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0">
                  <td className="py-2">{client.name}</td>
                  <td className="py-2 font-data">{formatCurrency(client.mrr)}</td>
                  <td className="py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        client.status === "active" && "bg-emerald-500/10 text-emerald-800",
                        client.status === "at_risk" && "bg-amber-500/10 text-amber-800",
                        client.status === "churned" && "bg-red-500/10 text-red-800"
                      )}
                    >
                      {client.status === "active"
                        ? "Actif"
                        : client.status === "at_risk"
                          ? "À risque"
                          : "Churné"}
                    </span>
                  </td>
                  <td className="py-2 font-data">{client.healthScore}</td>
                  <td className="py-2">{client.openTickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartSection>
    </div>
  );
}
