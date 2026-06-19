import {
  removeConnectorStream,
  stripConnectorMetrics,
  syncConnectorAllDemo,
  getConnector,
  type ConnectorId,
} from "@/lib/connectors";
import { getConnectorConnectionProfile } from "@/lib/connectors/connection-profile";
import {
  applyConnectorSyncToProject,
  applyGitHubSyncToProject,
  patchIntegrationMeta,
  removeGitHubRepoFromProject,
  setIntegrationError,
  type ConnectorSyncApiResponse,
} from "@/lib/connectors/integration-client";
import { listAutoSyncableConnectorIds } from "@/lib/connectors/auto-sync";
import type { Integration } from "@/lib/connectors/types";
import {
  syncProjectPhaseFromBuild,
  type GitHubConnection,
  type HostConnection,
  type UserProject,
} from "@/lib/portfolio";
import { queueProjectSync } from "@/lib/portfolio-sync-client";
import type { ConnectIntegrationOptions } from "./portfolio-types";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createConnectorActions(deps: PortfolioActionDeps) {
  const setGitHubConnection = (id: string, connection: GitHubConnection | undefined) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = { ...project, githubConnection: connection };
          return updated;
        }),
      );
    };

  const setHostConnection = (id: string, connection: HostConnection | undefined) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = syncProjectPhaseFromBuild({
            ...project,
            hostConnection: connection,
          });
          return updated;
        }),
      );
    };

  const connectIntegration = async (
      projectId: string,
      connectorId: ConnectorId,
      options?: ConnectIntegrationOptions,
    ) => {
      const profile = getConnectorConnectionProfile(connectorId);
      const connectorName = getConnector(connectorId)?.name ?? connectorId;

      if (options?.mode === "demo" && !profile.supportsDemo) {
        throw new Error(`La connexion démo ${connectorName} n'est plus disponible.`);
      }

      if (connectorId === "stripe" && options?.mode === "demo") {
        throw new Error("La connexion démo Stripe n'est plus disponible. Utilisez OAuth ou une clé restreinte.");
      }

      if (connectorId === "google-ads" && options?.mode === "demo") {
        throw new Error("La connexion démo Google Ads n'est plus disponible. Connectez votre compte via OAuth.");
      }

      if (connectorId === "meta-ads" && options?.mode === "demo") {
        throw new Error("La connexion démo Meta Ads n'est plus disponible. Connectez votre compte via OAuth.");
      }

      if (connectorId === "tiktok-ads" && options?.mode === "demo") {
        throw new Error("La connexion démo TikTok Ads n'est plus disponible. Connectez votre compte via OAuth.");
      }

      if (connectorId === "linkedin-ads" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo LinkedIn Ads n'est plus disponible. Connectez votre compte via OAuth.",
        );
      }
      if (connectorId === "microsoft-ads" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Microsoft Ads n'est plus disponible. Connectez votre compte via OAuth.",
        );
      }

      if (connectorId === "lemon-squeezy" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Lemon Squeezy n'est plus disponible. Connectez votre boutique via clé API.",
        );
      }

      if (connectorId === "paddle" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Paddle n'est plus disponible. Connectez votre compte via clé API.",
        );
      }

      if (connectorId === "freemius" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Freemius n'est plus disponible. Connectez votre produit via Bearer Token.",
        );
      }

      if (connectorId === "posthog" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo PostHog n'est plus disponible. Connectez votre projet via Personal API Key.",
        );
      }

      if (connectorId === "google-analytics" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Google Analytics n'est plus disponible. Connectez votre propriété GA4 via OAuth.",
        );
      }

      if (connectorId === "stripe" && options?.mode !== "real" && !options?.secretKey?.trim()) {
        throw new Error("Connectez Stripe via OAuth ou une clé restreinte.");
      }

      const isStripeReal =
        connectorId === "stripe" &&
        options?.mode === "real" &&
        (Boolean(options.secretKey?.trim()) || !options.secretKey);

      if (isStripeReal && options?.secretKey?.trim()) {
        try {
          const res = await fetch("/api/connectors/stripe/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              secretKey: options!.secretKey!.trim(),
              currency: options?.currency ?? "eur",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Stripe échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Stripe",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Stripe échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (isStripeReal) {
        try {
          const res = await fetch("/api/connectors/stripe/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Stripe échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Stripe",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Stripe échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isGoogleAdsReal =
        connectorId === "google-ads" &&
        options?.mode === "real" &&
        Boolean(options.customerId?.trim());

      if (isGoogleAdsReal) {
        try {
          const res = await fetch("/api/connectors/google-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              customerId: options!.customerId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Google Ads échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Google Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Google Ads échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "google-ads") {
        throw new Error("Connectez Google Ads via OAuth.");
      }

      const isMetaAdsReal =
        connectorId === "meta-ads" &&
        options?.mode === "real" &&
        Boolean(options.adAccountId?.trim());

      if (isMetaAdsReal) {
        try {
          const res = await fetch("/api/connectors/meta-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              adAccountId: options!.adAccountId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Meta Ads échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Meta Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Meta Ads échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "meta-ads") {
        throw new Error("Connectez Meta Ads via OAuth.");
      }

      const isTikTokAdsReal =
        connectorId === "tiktok-ads" &&
        options?.mode === "real" &&
        Boolean(options.adAccountId?.trim());

      if (isTikTokAdsReal) {
        try {
          const res = await fetch("/api/connectors/tiktok-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              advertiserId: options!.adAccountId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion TikTok Ads échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "TikTok Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion TikTok Ads échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "tiktok-ads") {
        throw new Error("Connectez TikTok Ads via OAuth.");
      }

      const isLinkedInAdsReal =
        connectorId === "linkedin-ads" &&
        options?.mode === "real" &&
        Boolean(options.adAccountId?.trim());

      if (isLinkedInAdsReal) {
        try {
          const res = await fetch("/api/connectors/linkedin-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              adAccountId: options!.adAccountId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion LinkedIn Ads échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "LinkedIn Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion LinkedIn Ads échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "linkedin-ads") {
        throw new Error("Connectez LinkedIn Ads via OAuth.");
      }

      const isMicrosoftAdsReal =
        connectorId === "microsoft-ads" &&
        options?.mode === "real" &&
        Boolean(options.accountId?.trim()) &&
        Boolean(options.customerId?.trim());

      if (isMicrosoftAdsReal) {
        try {
          const res = await fetch("/api/connectors/microsoft-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              accountId: options!.accountId!.trim(),
              customerId: options!.customerId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Microsoft Ads échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Microsoft Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Microsoft Ads échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "microsoft-ads") {
        throw new Error("Connectez Microsoft Ads via OAuth.");
      }

      const isGitHubReal =
        connectorId === "github" &&
        options?.mode === "real" &&
        Boolean(options.repoFullName?.trim());

      if (isGitHubReal) {
        try {
          const res = await fetch("/api/connectors/github/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              repoFullName: options!.repoFullName!.trim(),
              linkedToolId: options?.linkedToolId,
              setPrimary: options?.setPrimary,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion GitHub échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyGitHubSyncToProject(project, data, "connected");
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion GitHub échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "github" && options?.mode !== "demo") {
        throw new Error("Connectez GitHub via l'app GitHub.");
      }

      const isPlausibleReal =
        connectorId === "plausible" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim()) &&
        Boolean(options.siteId?.trim());

      if (isPlausibleReal) {
        try {
          const res = await fetch("/api/connectors/plausible/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              siteId: options!.siteId!.trim(),
              signupGoalDisplayName: options?.signupGoalDisplayName ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Plausible échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.siteId!.trim(),
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Plausible échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isFathomReal =
        connectorId === "fathom" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim()) &&
        Boolean(options.siteId?.trim());

      if (isFathomReal) {
        try {
          const res = await fetch("/api/connectors/fathom/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              siteId: options!.siteId!.trim(),
              signupEventId: options?.signupEvent ?? null,
              signupEventName: options?.signupEventName ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Fathom échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.siteId!.trim(),
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Fathom échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isGoogleAnalyticsReal =
        connectorId === "google-analytics" &&
        options?.mode === "real" &&
        Boolean(options.gaPropertyId?.trim());

      if (isGoogleAnalyticsReal) {
        try {
          const res = await fetch("/api/connectors/google-analytics/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              propertyId: options!.gaPropertyId!.trim(),
              propertyDisplayName: options?.propertyDisplayName?.trim() || undefined,
              signupEvent: options?.signupEvent ?? "sign_up",
              trialEvent: options?.trialEvent ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Google Analytics échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options?.propertyDisplayName ?? "Google Analytics",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Connexion Google Analytics échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isSentryReal =
        connectorId === "sentry" &&
        options?.mode === "real" &&
        Boolean(options.sentryProjectId?.trim());

      if (isSentryReal) {
        try {
          const res = await fetch("/api/connectors/sentry/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              sentryProjectId: options!.sentryProjectId!.trim(),
              sentryProjectSlug: options?.sentryProjectSlug?.trim() || undefined,
              projectName: options?.sentryProjectName?.trim() || undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            tokenExpiresAt?: string;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Sentry échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options?.sentryProjectName ?? "Sentry",
              );
              if (updated && data.tokenExpiresAt) {
                updated = {
                  ...updated,
                  integrations: updated.integrations?.map((integration) =>
                    integration.connectorId === connectorId
                      ? { ...integration, tokenExpiresAt: data.tokenExpiresAt }
                      : integration,
                  ),
                };
              }
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Sentry échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isPostHogReal =
        connectorId === "posthog" &&
        options?.mode === "real" &&
        Boolean(options.personalApiKey?.trim()) &&
        Boolean(options.posthogProjectId?.trim());

      if (isPostHogReal) {
        try {
          const res = await fetch("/api/connectors/posthog/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              personalApiKey: options!.personalApiKey!.trim(),
              posthogProjectId: options!.posthogProjectId!.trim(),
              appHost: options?.appHost?.trim() || undefined,
              signupEvent: options?.signupEvent ?? null,
              activationEvent: options?.activationEvent ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion PostHog échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? `PostHog ${options!.posthogProjectId!.trim()}`,
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion PostHog échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isMixpanelReal =
        connectorId === "mixpanel" &&
        options?.mode === "real" &&
        Boolean(options.mixpanelServiceAccountUsername?.trim()) &&
        Boolean(options.mixpanelServiceAccountSecret?.trim()) &&
        Boolean(options.mixpanelProjectId?.trim()) &&
        Boolean(options.activityEvent?.trim() || options.signupEvent?.trim());

      if (isMixpanelReal) {
        try {
          const res = await fetch("/api/connectors/mixpanel/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              serviceAccountUsername: options!.mixpanelServiceAccountUsername!.trim(),
              serviceAccountSecret: options!.mixpanelServiceAccountSecret!.trim(),
              mixpanelProjectId: options!.mixpanelProjectId!.trim(),
              region: options?.mixpanelRegion?.trim() || undefined,
              workspaceId: options?.mixpanelWorkspaceId ?? null,
              signupEvent: options?.signupEvent ?? null,
              activationEvent: options?.activationEvent ?? null,
              activityEvent: options?.activityEvent ?? options?.signupEvent ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Mixpanel échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? `Mixpanel ${options!.mixpanelProjectId!.trim()}`,
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Mixpanel échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isLemonSqueezyReal =
        connectorId === "lemon-squeezy" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim()) &&
        Boolean(options.storeId?.trim());

      if (isLemonSqueezyReal) {
        try {
          const res = await fetch("/api/connectors/lemon-squeezy/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              storeId: options!.storeId!.trim(),
              storeName: options?.storeName ?? undefined,
              currency: options?.currency ?? undefined,
              testMode: options?.testMode ?? undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Lemon Squeezy échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.storeName ?? "Lemon Squeezy",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Lemon Squeezy échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isPaddleReal =
        connectorId === "paddle" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim());

      if (isPaddleReal) {
        try {
          const res = await fetch("/api/connectors/paddle/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              currency: options?.currency ?? undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Paddle échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Paddle",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Paddle échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isFreemiusReal =
        connectorId === "freemius" &&
        options?.mode === "real" &&
        Boolean(options.productId?.trim()) &&
        Boolean(options.apiToken?.trim());

      if (isFreemiusReal) {
        try {
          const res = await fetch("/api/connectors/freemius/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              productId: options!.productId!.trim(),
              apiToken: options!.apiToken!.trim(),
              productTitle: options?.productTitle ?? undefined,
              currency: options?.currency ?? undefined,
              sandbox: options?.sandbox ?? undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Freemius échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.productTitle ?? "Freemius",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Freemius échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isLoopsReal =
        connectorId === "loops" &&
        options?.mode === "real" &&
        Boolean(options.loopsApiKey?.trim() || options.apiKey?.trim()) &&
        Boolean(options.loopsWebhookSigningSecret?.trim());

      if (isLoopsReal) {
        try {
          const res = await fetch("/api/connectors/loops/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: (options!.loopsApiKey ?? options!.apiKey)!.trim(),
              webhookSigningSecret: options!.loopsWebhookSigningSecret!.trim(),
              conversionListId: options?.loopsConversionListId ?? null,
              conversionListName: options?.loopsConversionListName ?? null,
              conversionMode: options?.loopsConversionMode ?? "email_clicked",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Loops échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Loops",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Loops échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isBrevoReal =
        connectorId === "brevo" &&
        options?.mode === "real" &&
        Boolean(options.brevoApiKey?.trim() || options.apiKey?.trim());

      if (isBrevoReal) {
        try {
          const res = await fetch("/api/connectors/brevo/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: (options!.brevoApiKey ?? options!.apiKey)!.trim(),
              conversionMode: options?.brevoConversionMode ?? "campaign_clicks",
              conversionListId: options?.brevoConversionListId ?? null,
              conversionListName: options?.brevoConversionListName ?? null,
              webhookToken: options?.brevoWebhookToken ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Brevo échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Brevo",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Brevo échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isResendReal =
        connectorId === "resend" &&
        options?.mode === "real" &&
        Boolean(options.resendApiKey?.trim() || options.apiKey?.trim()) &&
        Boolean(options.resendWebhookSigningSecret?.trim());

      if (isResendReal) {
        try {
          const res = await fetch("/api/connectors/resend/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: (options!.resendApiKey ?? options!.apiKey)!.trim(),
              webhookSigningSecret: options!.resendWebhookSigningSecret!.trim(),
              conversionSegmentId: options?.resendConversionSegmentId ?? null,
              conversionSegmentName: options?.resendConversionSegmentName ?? null,
              conversionMode: options?.resendConversionMode ?? "email_clicked",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Resend échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Resend",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Resend échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isCrispReal =
        connectorId === "crisp" &&
        options?.mode === "real" &&
        Boolean(options.crispWebsiteId?.trim());

      if (isCrispReal) {
        try {
          const res = await fetch("/api/connectors/crisp/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              websiteId: options!.crispWebsiteId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Crisp échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.crispWebsiteId!.trim(),
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Crisp échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isIntercomReal = connectorId === "intercom" && options?.mode === "real";

      if (isIntercomReal) {
        try {
          const res = await fetch("/api/connectors/intercom/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Intercom échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Intercom",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Intercom échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "intercom" && options?.mode !== "demo") {
        throw new Error("Connectez Intercom via OAuth.");
      }

      const isHubSpotReal = connectorId === "hubspot" && options?.mode === "real";

      if (isHubSpotReal) {
        try {
          const res = await fetch("/api/connectors/hubspot/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion HubSpot échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "HubSpot",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion HubSpot échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "hubspot" && options?.mode !== "demo") {
        throw new Error("Connectez HubSpot via OAuth.");
      }

      const isPipedriveReal = connectorId === "pipedrive" && options?.mode === "real";

      if (isPipedriveReal) {
        try {
          const res = await fetch("/api/connectors/pipedrive/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Pipedrive échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Pipedrive",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Pipedrive échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "pipedrive" && options?.mode !== "demo") {
        throw new Error("Connectez Pipedrive via OAuth.");
      }

      const isQontoReal = connectorId === "qonto" && options?.mode === "real";

      if (isQontoReal) {
        try {
          const res = await fetch("/api/connectors/qonto/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Qonto échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Qonto",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Qonto échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "qonto" && options?.mode !== "demo") {
        throw new Error("Connectez Qonto via OAuth.");
      }

      const isPennylaneReal = connectorId === "pennylane" && options?.mode === "real";

      if (isPennylaneReal) {
        try {
          const body: Record<string, string> = { projectId };
          if (options?.apiToken?.trim()) {
            body.apiToken = options.apiToken.trim();
          }

          const res = await fetch("/api/connectors/pennylane/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Pennylane échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Pennylane",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Pennylane échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "pennylane" && options?.mode !== "demo") {
        throw new Error("Connectez Pennylane via token API ou OAuth.");
      }

      const isAbbyReal =
        connectorId === "abby" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim());

      if (isAbbyReal) {
        try {
          const res = await fetch("/api/connectors/abby/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            revenueUnavailable?: boolean;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Abby échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Abby",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Abby échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "abby" && options?.mode !== "demo") {
        throw new Error("Connectez Abby via clé API.");
      }

      const isBetterStackReal =
        connectorId === "better-stack" &&
        options?.mode === "real" &&
        Boolean(options.betterStackApiToken?.trim()) &&
        Boolean(options.betterStackMonitorId?.trim());

      if (isBetterStackReal) {
        try {
          const res = await fetch("/api/connectors/better-stack/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiToken: options!.betterStackApiToken!.trim(),
              monitorId: options!.betterStackMonitorId!.trim(),
              monitorName: options?.betterStackMonitorName ?? null,
              monitorUrl: options?.betterStackMonitorUrl ?? null,
              teamName: options?.betterStackTeamName ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Better Stack échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options?.betterStackMonitorName ?? "Better Stack",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Better Stack échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId ? setIntegrationError(project, connectorId, message) : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "better-stack" && options?.mode !== "demo") {
        throw new Error("Connectez Better Stack via token API Uptime.");
      }

      const isSlackReal =
        connectorId === "slack" &&
        options?.mode === "real" &&
        Boolean(options.channelId?.trim());

      if (isSlackReal) {
        try {
          const res = await fetch("/api/connectors/slack/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              channelId: options!.channelId!.trim(),
              channelName: options?.channelName?.trim() || undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Slack échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Slack",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Slack échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "slack" && options?.mode !== "demo") {
        throw new Error("Connectez Slack via OAuth et sélectionnez un canal.");
      }

      const isZendeskReal = connectorId === "zendesk" && options?.mode === "real";

      if (isZendeskReal) {
        try {
          const res = await fetch("/api/connectors/zendesk/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Zendesk échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Zendesk",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Zendesk échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "zendesk" && options?.mode !== "demo") {
        throw new Error("Connectez Zendesk via OAuth.");
      }

      const isVercelReal =
        connectorId === "vercel" &&
        options?.mode === "real" &&
        Boolean(options.vercelProjectId?.trim());

      if (isVercelReal) {
        try {
          const res = await fetch("/api/connectors/vercel/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              vercelProjectId: options!.vercelProjectId!.trim(),
              action: "sync",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            connection?: HostConnection;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Vercel échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              let next = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.vercelProjectId!.trim(),
              );
              if (data.connection) {
                next = { ...next, hostConnection: data.connection };
              }
              updated = next;
              return next;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Vercel échouée";
          deps.commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "vercel" && options?.mode !== "demo") {
        throw new Error("Connectez Vercel via OAuth.");
      }

      if (connectorId === "paddle") {
        throw new Error("Connectez Paddle via une clé API.");
      }

      if (connectorId === "freemius") {
        throw new Error("Connectez Freemius via Bearer Token produit.");
      }

      if (connectorId === "posthog") {
        throw new Error("Connectez PostHog via Personal API Key.");
      }

      if (connectorId === "google-analytics") {
        throw new Error("Connectez Google Analytics via OAuth.");
      }

      if (connectorId === "sentry" && options?.mode === "real") {
        throw new Error("Connectez Sentry via OAuth.");
      }

      if (!profile.supportsDemo) {
        throw new Error(`Connectez ${connectorName} via une connexion réelle.`);
      }

      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const opportunity = deps.getCatalogOpportunity(project.opportunitySlug);
          if (!opportunity) return project;
          const now = new Date().toISOString();
          const { snapshots, stream } = syncConnectorAllDemo(project, connectorId, opportunity);
          const demoResult: ConnectorSyncApiResponse = {
            snapshots,
            stream,
            syncedAt: now,
          };
          const oppName = opportunity.name;
          return applyConnectorSyncToProject(
            project,
            connectorId,
            demoResult,
            "demo",
            `Démo · ${oppName}`,
          );
        }),
      );
    };

  const disconnectIntegration = async (projectId: string, connectorId: ConnectorId) => {
      if (connectorId === "stripe") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "stripe");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/stripe/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "google-ads") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "google-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/google-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "meta-ads") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "meta-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/meta-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "tiktok-ads") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "tiktok-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/tiktok-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "linkedin-ads") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "linkedin-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/linkedin-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "microsoft-ads") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "microsoft-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/microsoft-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "plausible") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "plausible");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/plausible/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "fathom") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "fathom");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/fathom/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "lemon-squeezy") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "lemon-squeezy");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/lemon-squeezy/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "paddle") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "paddle");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/paddle/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "freemius") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "freemius");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/freemius/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "posthog") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "posthog");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/posthog/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "mixpanel") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "mixpanel");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/mixpanel/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "google-analytics") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find(
          (i) => i.connectorId === "google-analytics",
        );
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/google-analytics/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "sentry") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "sentry");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/sentry/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "loops") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "loops");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/loops/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "brevo") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "brevo");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/brevo/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "resend") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "resend");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/resend/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "crisp") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "crisp");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/crisp/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "intercom") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "intercom");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/intercom/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "hubspot") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "hubspot");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/hubspot/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "pipedrive") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "pipedrive");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/pipedrive/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "qonto") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "qonto");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/qonto/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "pennylane") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "pennylane");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/pennylane/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "abby") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "abby");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/abby/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "better-stack") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "better-stack");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/better-stack/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "slack") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "slack");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/slack/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "zendesk") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "zendesk");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/zendesk/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "vercel") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "vercel");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/vercel/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "github") {
        const project = deps.getProjects().find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "github");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/github/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            integrations: (project.integrations ?? []).map((i) =>
              i.connectorId === connectorId ? { ...i, status: "disconnected" as const } : i,
            ),
            connectorStreams: removeConnectorStream(project.connectorStreams ?? {}, connectorId),
            metricsHistory: stripConnectorMetrics(project.metricsHistory ?? [], connectorId),
            ...(connectorId === "vercel" && project.hostConnection?.provider === "vercel"
              ? { hostConnection: undefined }
              : {}),
            ...(connectorId === "github"
              ? { githubConnection: undefined, githubTrackedRepos: undefined }
              : {}),
          };
        }),
      );
    };

  const syncIntegration = async (projectId: string, connectorId: ConnectorId) => {
      const project = deps.getProjects().find((p) => p.id === projectId);
      const integration = project?.integrations?.find((i) => i.connectorId === connectorId);

      if (connectorId === "stripe") {
        if (integration?.status === "connected" || integration?.status === "demo") {
          try {
            const res = await fetch("/api/connectors/stripe/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Stripe échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Stripe",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Stripe échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Stripe via OAuth ou une clé restreinte.");
      }

      if (connectorId === "google-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/google-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Google Ads échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Google Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Google Ads échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Google Ads via OAuth.");
      }

      if (connectorId === "meta-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/meta-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Meta Ads échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Meta Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Meta Ads échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Meta Ads via OAuth.");
      }

      if (connectorId === "tiktok-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/tiktok-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation TikTok Ads échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "TikTok Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation TikTok Ads échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez TikTok Ads via OAuth.");
      }

      if (connectorId === "linkedin-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/linkedin-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation LinkedIn Ads échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "LinkedIn Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation LinkedIn Ads échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez LinkedIn Ads via OAuth.");
      }

      if (connectorId === "microsoft-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/microsoft-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Microsoft Ads échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Microsoft Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Microsoft Ads échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Microsoft Ads via OAuth.");
      }

      if (connectorId === "github") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/github/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation GitHub échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyGitHubSyncToProject(p, data, "connected");
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation GitHub échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez GitHub via l'app GitHub.");
      }

      if (connectorId === "plausible") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/plausible/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Plausible échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Plausible",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Plausible échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Plausible via une clé Stats API.");
      }

      if (connectorId === "fathom") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/fathom/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Fathom échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Fathom",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Fathom échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Fathom via une clé API.");
      }

      if (connectorId === "lemon-squeezy") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/lemon-squeezy/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Lemon Squeezy échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Lemon Squeezy",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Lemon Squeezy échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Lemon Squeezy via une clé API.");
      }

      if (connectorId === "paddle") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/paddle/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Paddle échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Paddle",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Paddle échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Paddle via une clé API.");
      }

      if (connectorId === "freemius") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/freemius/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Freemius échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Freemius",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Freemius échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Freemius via Bearer Token produit.");
      }

      if (connectorId === "posthog") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/posthog/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation PostHog échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "PostHog",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation PostHog échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez PostHog via Personal API Key.");
      }

      if (connectorId === "mixpanel") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/mixpanel/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Mixpanel échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Mixpanel",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Mixpanel échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Mixpanel via Service Account.");
      }

      if (connectorId === "google-analytics") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/google-analytics/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Google Analytics échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Google Analytics",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Google Analytics échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Google Analytics via OAuth.");
      }

      if (connectorId === "sentry") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/sentry/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & {
              error?: string;
              tokenExpiresAt?: string;
            };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Sentry échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Sentry",
                );
                if (updated && data.tokenExpiresAt) {
                  updated = {
                    ...updated,
                    integrations: updated.integrations?.map((item) =>
                      item.connectorId === connectorId
                        ? { ...item, tokenExpiresAt: data.tokenExpiresAt }
                        : item,
                    ),
                  };
                }
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Sentry échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Sentry via OAuth.");
      }

      if (connectorId === "crisp") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/crisp/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Crisp échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Crisp",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Crisp échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Crisp via le plugin Marketplace et le Website ID.");
      }

      if (connectorId === "intercom") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/intercom/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Intercom échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Intercom",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Intercom échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Intercom via OAuth.");
      }

      if (connectorId === "hubspot") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/hubspot/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation HubSpot échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "HubSpot",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation HubSpot échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez HubSpot via OAuth.");
      }

      if (connectorId === "pipedrive") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/pipedrive/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Pipedrive échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Pipedrive",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Pipedrive échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Pipedrive via OAuth.");
      }

      if (connectorId === "qonto") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/qonto/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Qonto échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Qonto",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Qonto échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Qonto via OAuth.");
      }

      if (connectorId === "pennylane") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/pennylane/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Pennylane échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Pennylane",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Pennylane échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Pennylane via token API ou OAuth.");
      }

      if (connectorId === "abby") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/abby/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Abby échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Abby",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Abby échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Abby via clé API.");
      }

      if (connectorId === "better-stack") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/better-stack/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Better Stack échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Better Stack",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Better Stack échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }
      }

      if (connectorId === "slack") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/slack/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Slack échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Slack",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Slack échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Slack via OAuth et sélectionnez un canal.");
      }

      if (connectorId === "zendesk") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/zendesk/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Zendesk échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Zendesk",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Zendesk échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Zendesk via OAuth.");
      }

      if (connectorId === "brevo") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/brevo/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Brevo échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Brevo",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Brevo échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Brevo via une clé API.");
      }

      if (connectorId === "resend") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/resend/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Resend échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Resend",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Resend échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Resend via une clé API Full access.");
      }

      if (connectorId === "loops") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/loops/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Loops échouée");
            }

            let updated: UserProject | undefined;
            deps.commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Loops",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Loops échouée";
            deps.commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Loops via une clé API et un webhook.");
      }

      if (connectorId === "vercel") {
        try {
          const res = await fetch("/api/connectors/vercel/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, action: "sync" }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            connection?: HostConnection;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Synchronisation Vercel échouée");
          }

          let updated: UserProject | undefined;
          deps.commit((prev) =>
            prev.map((p) => {
              if (p.id !== projectId) return p;
              let next = applyConnectorSyncToProject(
                p,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? integration?.accountLabel ?? "Vercel",
              );
              if (data.connection) {
                next = { ...next, hostConnection: data.connection };
              }
              updated = next;
              return next;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Synchronisation Vercel échouée";
          deps.commit((prev) =>
            prev.map((p) =>
              p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
            ),
          );
          throw err;
        }
        return;
      }

      const profile = getConnectorConnectionProfile(connectorId);
      const connectorName = getConnector(connectorId)?.name ?? connectorId;
      if (profile.supportsDemo) {
        await connectIntegration(projectId, connectorId, { mode: "demo" });
        return;
      }

      throw new Error(`Connectez ${connectorName} via une connexion réelle.`);
    };

  const syncProjectIntegrations = async (projectId: string, opts?: { force?: boolean }) => {
      const project = deps.getProjects().find((p) => p.id === projectId);
      if (!project) return;

      const connectorIds = listAutoSyncableConnectorIds(project.integrations ?? [], opts);
      if (connectorIds.length === 0) return;

      deps.setAutoSyncState({ projectId, connectorIds });

      try {
        for (const connectorId of connectorIds) {
          try {
            await syncIntegration(projectId, connectorId);
          } catch {
            // Erreur déjà enregistrée sur l'intégration via syncIntegration.
          }
        }
      } finally {
        deps.setAutoSyncState(null);
      }
    };

  const removeGitHubRepo = async (projectId: string, repoFullName: string) => {
      try {
        const res = await fetch("/api/connectors/github/repos/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, repoFullName }),
        });
        const data = (await res.json()) as { disconnected?: boolean; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Retrait du dépôt échoué");
        }

        let updated: UserProject | undefined;
        deps.commit((prev) =>
          prev.map((project) => {
            if (project.id !== projectId) return project;
            updated = removeGitHubRepoFromProject(
              project,
              repoFullName,
              Boolean(data.disconnected),
            );
            return updated;
          }),
        );
        if (updated) queueProjectSync(updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Retrait du dépôt échoué";
        deps.commit((prev) =>
          prev.map((project) =>
            project.id === projectId ? setIntegrationError(project, "github", message) : project,
          ),
        );
        throw err;
      }
    };

  const patchIntegration = (projectId: string, connectorId: ConnectorId, patch: Partial<Integration>) => {
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
  return {
    setGitHubConnection,
    setHostConnection,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    syncProjectIntegrations,
    removeGitHubRepo,
    patchIntegration,
  };
}
