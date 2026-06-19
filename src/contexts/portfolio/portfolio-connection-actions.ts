import { patchIntegrationMeta } from "@/lib/connectors/integration-client";
import type { Integration } from "@/lib/connectors/types";
import type { ConnectorId } from "@/lib/connectors";
import {
  syncProjectPhaseFromBuild,
  type GitHubConnection,
  type HostConnection,
  type UserProject,
} from "@/lib/portfolio";
import { queueProjectSync } from "@/lib/portfolio-sync-client";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createConnectionActions(deps: PortfolioActionDeps) {
  const setGitHubConnection = (id: string, connection: GitHubConnection | undefined) => {
    deps.commit((prev) =>
      prev.map((project) => {
        if (project.id !== id) return project;
        return { ...project, githubConnection: connection };
      }),
    );
  };

  const setHostConnection = (id: string, connection: HostConnection | undefined) => {
    deps.commit((prev) =>
      prev.map((project) => {
        if (project.id !== id) return project;
        return syncProjectPhaseFromBuild({
          ...project,
          hostConnection: connection,
        });
      }),
    );
  };

  const patchIntegration = (
    projectId: string,
    connectorId: ConnectorId,
    patch: Partial<Integration>,
  ) => {
    let updated: UserProject | undefined;
    deps.commit((prev) =>
      prev.map((project) => {
        if (project.id !== projectId) return project;
        updated = patchIntegrationMeta(project, connectorId, patch);
        return updated;
      }),
    );
    if (updated) queueProjectSync(updated);
  };

  return { setGitHubConnection, setHostConnection, patchIntegration };
}
