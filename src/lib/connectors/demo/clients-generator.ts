import type { ConnectorId } from "@/lib/connectors/types";
import { createRng } from "@/lib/connectors/demo/seeded-random";

export type DemoClient = {
  id: string;
  name: string;
  mrr: number;
  status: "active" | "at_risk" | "churned";
  lastActiveDays: number;
  openTickets: number;
  healthScore: number;
};

const NAMES = [
  "Cabinet Dupont",
  "Studio Martin",
  "Clinique Horizon",
  "Agence Lumière",
  "BTP Renard",
  "Cabinet Moreau",
  "Pharma Nord",
  "Legal Partners",
  "TechFlow SAS",
  "Artisan Pro",
  "MediCare Plus",
  "Compta Express",
  "DataSync FR",
  "GreenBuild",
  "SmartOffice",
];

export function generateDemoClients(seed: string, count = 15): DemoClient[] {
  const rng = createRng(`${seed}:clients`);
  return Array.from({ length: count }, (_, i) => {
    const lastActiveDays = Math.round(rng() * 60);
    const openTickets = rng() > 0.7 ? Math.round(rng() * 3) : 0;
    const mrr = Math.round(49 + rng() * 150);
    let status: DemoClient["status"] = "active";
    if (lastActiveDays > 45) status = "churned";
    else if (lastActiveDays > 21 || openTickets > 0) status = "at_risk";

    let healthScore = 100 - lastActiveDays - openTickets * 15;
    if (status === "churned") healthScore = Math.max(10, healthScore - 30);
    healthScore = Math.max(5, Math.min(100, healthScore));

    return {
      id: `client-${i}`,
      name: NAMES[i % NAMES.length],
      mrr,
      status,
      lastActiveDays,
      openTickets,
      healthScore,
    };
  });
}

export function getConnectorStreamForProject(
  streams: Partial<Record<ConnectorId, unknown>> | undefined,
  connectorId: ConnectorId
) {
  return streams?.[connectorId];
}
