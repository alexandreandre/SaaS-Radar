import type { ConnectorId } from "@/lib/connectors";
import type { Opportunity, OpportunityListItem } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";

export type AutoSyncState = {
  projectId: string;
  connectorIds: ConnectorId[];
} | null;

/** Dépendances injectées dans les factories d'actions portfolio (sans hooks React). */
export type PortfolioActionDeps = {
  commit: (updater: (prev: UserProject[]) => UserProject[]) => void;
  getProjects: () => UserProject[];
  getProjectById: (id: string) => UserProject | undefined;
  getCatalogOpportunity: (slug: string) => Opportunity | undefined;
  updateProject: (id: string, patch: Partial<UserProject>) => void;
  setAutoSyncState: (state: AutoSyncState) => void;
  catalogIndex: OpportunityListItem[];
};
