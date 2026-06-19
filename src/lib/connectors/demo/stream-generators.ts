import type { ConnectorId } from "@/lib/connectors/types";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import { createRng } from "@/lib/connectors/demo/seeded-random";

export function generateStreamDemo(
  connectorId: ConnectorId,
  seed: string,
  targetMrr: number
): ConnectorStreamPayload | null {
  const rng = createRng(`${seed}:stream`);
  const r = () => rng();

  switch (connectorId) {
    case "stripe":
    case "paddle":
    case "freemius":
      return {
        type: "payment",
        failedPayments: Math.round(1 + r() * 5),
        recoveredPayments: Math.round(r() * 3),
      };
    case "qonto":
      return {
        type: "finance",
        cashBalance: Math.round(3000 + r() * 15000),
        monthlyInflow: Math.round(targetMrr * (0.9 + r() * 0.2)),
        monthlyOutflow: Math.round(800 + r() * 1200),
        runwayDays: Math.round(90 + r() * 270),
      };
    case "pennylane":
    case "abby":
      return {
        type: "accounting",
        revenueBooked: Math.round(targetMrr * (0.95 + r() * 0.1)),
        expensesBooked: Math.round(600 + r() * 900),
        vatDue: Math.round(targetMrr * 0.2 * (0.8 + r() * 0.4)),
      };
    case "posthog":
    case "mixpanel":
    case "fathom":
      return {
        type: "product",
        activationRate: Math.round(25 + r() * 45),
        retentionD7: Math.round(15 + r() * 35),
        featureUsageTop: ["Dashboard", "Export PDF", "Notifications"][Math.floor(r() * 3)],
      };
    case "crisp":
    case "intercom":
    case "zendesk":
      return {
        type: "support",
        openTickets: Math.round(r() * 12),
        avgResponseHours: Math.round(2 + r() * 8),
        csat: Math.round(70 + r() * 25),
      };
    case "github": {
      const repoFullName = "demo/acme-app";
      const devStream = {
        type: "dev" as const,
        repoFullName,
        deploysLast30d: Math.round(4 + r() * 20),
        openIssues: Math.round(r() * 15),
        errorRate: Math.round(r() * 2 * 10) / 10,
        uptimePct: Math.round(985 + r() * 14) / 10,
        commitsLast7d: Math.round(1 + r() * 12),
        lastWorkflowConclusion: r() > 0.2 ? "success" : "failure",
      };
      return {
        type: "github" as const,
        primaryRepoFullName: repoFullName,
        repos: { [repoFullName]: devStream },
      };
    }
    case "vercel":
    case "better-stack":
      return {
        type: "dev",
        deploysLast30d: Math.round(8 + r() * 25),
        openIssues: Math.round(r() * 5),
        errorRate: Math.round(r() * 15) / 10,
        uptimePct: Math.round(990 + r() * 9) / 10,
      };
    case "sentry":
      return {
        type: "dev",
        deploysLast30d: Math.round(2 + r() * 10),
        openIssues: Math.round(1 + r() * 20),
        errorRate: Math.round(5 + r() * 40) / 10,
        uptimePct: Math.round(975 + r() * 24) / 10,
      };
    case "slack":
      return {
        type: "comms",
        alertsSent: Math.round(r() * 30),
        lastAlertAt: new Date(Date.now() - r() * 7 * 86400000).toISOString(),
      };
    case "hubspot":
    case "pipedrive":
      return {
        type: "crm",
        pipelineValue: Math.round(targetMrr * (2 + r() * 4)),
        dealsWon: Math.round(r() * 8),
        dealsLost: Math.round(r() * 4),
        avgCycleDays: Math.round(14 + r() * 45),
      };
    default:
      return null;
  }
}
