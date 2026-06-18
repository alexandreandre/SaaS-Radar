import type { Opportunity } from "@/types/opportunity";
import type { AdCampaign, ConnectorId, Expense, MetricsSnapshot } from "@/lib/connectors/types";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitData } from "@/hooks/use-cockpit-data";
import type { CockpitModuleId } from "@/lib/cockpit-modules";

export type CockpitModuleProps = {
  project: UserProject;
  opportunity: Opportunity;
  data: CockpitData;
  onToggleMilestone: (milestoneId: string) => void;
  onAddCampaign: (campaign: Omit<AdCampaign, "id">) => void;
  onUpdateCampaign: (id: string, patch: Partial<AdCampaign>) => void;
  onRemoveCampaign: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onRemoveExpense: (id: string) => void;
  onConnectIntegration: (
    connectorId: ConnectorId,
    options?: import("@/contexts/portfolio-context").ConnectIntegrationOptions,
  ) => Promise<void>;
  onSyncIntegration: (connectorId: ConnectorId) => Promise<void>;
  onDisconnectIntegration: (connectorId: ConnectorId) => Promise<void>;
  onPatchIntegration: (
    connectorId: ConnectorId,
    patch: Partial<import("@/lib/connectors/types").Integration>,
  ) => void;
  onLogMetrics: (partial: Partial<MetricsSnapshot>) => void;
  onRecordMrr: (amount: number, note?: string) => void;
  onSetCashOnHand: (amount: number) => void;
  onModuleChange: (module: CockpitModuleId) => void;
};
