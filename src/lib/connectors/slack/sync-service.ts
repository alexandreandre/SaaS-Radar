import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildSlackAccountLabel,
  parseSlackOAuthResponse,
} from "@/lib/connectors/slack/alert-dispatch";
import { listPostableChannels, validateSlackCredential } from "@/lib/connectors/slack/client";
import { fetchSlackConnectorSync } from "@/lib/connectors/slack/metrics";
import { exchangeSlackCode } from "@/lib/connectors/slack/oauth";
import type { SlackChannelSummary, SlackCredential } from "@/lib/connectors/slack/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import { resolveCockpitOpportunity } from "@/lib/idea/to-opportunity";
import {
  getEnrichedOpportunityBySlug,
  getEnrichedOpportunityBySlugIncludingArchived,
} from "@/lib/opportunities";
import { loadUserProjectAsService } from "@/lib/portfolio-sync";
import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";

export async function loadSlackCredential(
  userId: string,
  projectId: string,
): Promise<SlackCredential | null> {
  const stored = await loadConnectorCredential<SlackCredential>(userId, projectId, "slack");
  return stored?.data ?? null;
}

async function persistSlackCredential(
  userId: string,
  projectId: string,
  credential: SlackCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "slack", credential, {
    oauthConnected: true,
    accountLabel: buildSlackAccountLabel(credential),
    teamName: credential.teamName,
    channelName: credential.channelName,
    alertsSent: credential.alertsSent ?? 0,
    lastAlertAt: credential.lastAlertAt ?? null,
    ...metadata,
  });
}

async function loadCockpitOpportunityForProject(
  project: UserProject,
): Promise<Opportunity | null> {
  let catalog = project.opportunitySlug
    ? await getEnrichedOpportunityBySlug(project.opportunitySlug)
    : null;
  if (!catalog && project.opportunitySlug) {
    catalog = await getEnrichedOpportunityBySlugIncludingArchived(project.opportunitySlug);
  }
  return resolveCockpitOpportunity(project, catalog);
}

export async function saveSlackCredentialWithChannel(
  userId: string,
  projectId: string,
  channelId: string,
  channelName?: string,
): Promise<{ accountLabel: string; credential: SlackCredential }> {
  const existing = await loadSlackCredential(userId, projectId);
  if (!existing?.botAccessToken) {
    throw new Error("Slack non autorisé — terminez d'abord la connexion OAuth.");
  }

  const credential: SlackCredential = {
    ...existing,
    channelId: channelId.trim(),
    channelName: channelName?.trim() || existing.channelName,
  };

  const validated = await validateSlackCredential(credential);
  await persistSlackCredential(userId, projectId, validated.credential, {
    accountLabel: validated.accountLabel,
  });

  return validated;
}

export async function runSlackSync(
  userId: string,
  projectId: string,
  opts?: { sendWelcome?: boolean },
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadSlackCredential(userId, projectId);
  if (!credential?.botAccessToken) {
    throw new Error("Slack non connecté pour ce projet");
  }

  const project = await loadUserProjectAsService(userId, projectId);
  if (!project) {
    throw new Error("Projet introuvable");
  }

  const opportunity = await loadCockpitOpportunityForProject(project);
  const result = await fetchSlackConnectorSync(credential, {
    project,
    opportunity,
    projectId,
    sendWelcome: opts?.sendWelcome,
  });

  await persistSlackCredential(userId, projectId, result.refreshedCredential, {
    accountLabel: result.accountLabel,
  });

  return {
    stream: result.stream,
    accountLabel: result.accountLabel ?? credential.teamName ?? "Slack",
    syncedAt: result.syncedAt,
  };
}

export async function listSlackChannels(
  userId: string,
  projectId: string,
): Promise<SlackChannelSummary[]> {
  const credential = await loadSlackCredential(userId, projectId);
  if (!credential?.botAccessToken) {
    throw new Error("Slack non connecté — terminez d'abord OAuth.");
  }

  return listPostableChannels(credential.botAccessToken);
}

export async function disconnectSlack(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "slack");
}

export async function exchangeAndStoreSlackOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<{ accountLabel: string }> {
  const oauth = await exchangeSlackCode(code);
  const parsed = parseSlackOAuthResponse(oauth);
  if (!parsed) {
    throw new Error("Réponse OAuth Slack invalide");
  }

  const existing = await loadSlackCredential(userId, projectId);
  const credential: SlackCredential = {
    ...parsed,
    channelId: existing?.channelId,
    channelName: existing?.channelName,
    alertsSent: existing?.alertsSent ?? 0,
    lastAlertAt: existing?.lastAlertAt ?? null,
    deliveredAlertIds: existing?.deliveredAlertIds ?? [],
  };

  await persistSlackCredential(userId, projectId, credential, {
    accountLabel: buildSlackAccountLabel(credential),
  });

  return { accountLabel: buildSlackAccountLabel(credential) };
}
