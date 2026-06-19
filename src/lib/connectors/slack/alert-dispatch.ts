import type { CockpitAlert } from "@/lib/cockpit-alerts";
import type { CommsStream } from "@/lib/connectors/streams";
import type {
  SlackCredential,
  SlackOAuthAccessResponse,
} from "@/lib/connectors/slack/types";
import { SLACK_DELIVERED_ALERT_IDS_MAX } from "@/lib/connectors/slack/types";

const SEVERITY_EMOJI: Record<CockpitAlert["severity"], string> = {
  critical: ":rotating_light:",
  warning: ":warning:",
  info: ":information_source:",
};

export function severityEmoji(severity: CockpitAlert["severity"]): string {
  return SEVERITY_EMOJI[severity];
}

export function buildSlackAccountLabel(credential: Pick<SlackCredential, "channelName" | "teamName">): string {
  const channel = credential.channelName?.trim();
  const team = credential.teamName?.trim() || "Slack";
  if (channel) return `${channel} · ${team}`;
  return team;
}

export function filterUndeliveredAlerts(
  alerts: CockpitAlert[],
  deliveredIds: string[] = [],
): CockpitAlert[] {
  const delivered = new Set(deliveredIds);
  return alerts.filter((alert) => !delivered.has(alert.id));
}

export function trimDeliveredAlertIds(
  deliveredIds: string[],
  newlyDelivered: string[],
): string[] {
  const merged = [...deliveredIds, ...newlyDelivered];
  if (merged.length <= SLACK_DELIVERED_ALERT_IDS_MAX) return merged;
  return merged.slice(merged.length - SLACK_DELIVERED_ALERT_IDS_MAX);
}

export function buildCommsStreamFromStats(stats: {
  alertsSent: number;
  lastAlertAt?: string | null;
  syncedAt?: string;
}): CommsStream {
  return {
    type: "comms",
    alertsSent: stats.alertsSent,
    lastAlertAt: stats.lastAlertAt?.trim() || stats.syncedAt || new Date(0).toISOString(),
  };
}

export function formatSlackAlertBlocks(
  alert: CockpitAlert,
  cockpitUrl: string,
): { blocks: Record<string, unknown>[]; text: string } {
  const moduleUrl = `${cockpitUrl.replace(/\/$/, "")}?module=${encodeURIComponent(alert.actionModule)}`;
  const emoji = severityEmoji(alert.severity);
  const text = `${emoji} ${alert.message}`;

  return {
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *Alerte SaaS-Radar*\n${alert.message}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Voir dans le cockpit", emoji: true },
            url: moduleUrl,
          },
        ],
      },
    ],
  };
}

export function formatSlackWelcomeBlocks(channelName?: string): {
  blocks: Record<string, unknown>[];
  text: string;
} {
  const label = channelName?.trim() || "ce canal";
  const text = `SaaS-Radar est connecté à ${label}. Vous recevrez ici les alertes MRR, churn, ROAS et santé intégrations.`;

  return {
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:white_check_mark: *SaaS-Radar connecté*\nLes alertes cockpit seront publiées dans ${label}.\n\n_Canal privé ?_ Invitez le bot SaaS-Radar dans le canal (/invite @SaaS-Radar).`,
        },
      },
    ],
  };
}

export function parseSlackOAuthResponse(data: SlackOAuthAccessResponse): SlackCredential | null {
  if (!data.ok || !data.access_token || !data.team?.id) return null;

  return {
    botAccessToken: data.access_token,
    teamId: data.team.id,
    teamName: data.team.name?.trim() || data.team.id,
    botUserId: data.bot_user_id,
    appId: data.app_id,
    scopes: data.scope,
    alertsSent: 0,
    lastAlertAt: null,
    deliveredAlertIds: [],
  };
}

export function mapSlackPostError(errorCode: string | undefined): string {
  switch (errorCode) {
    case "not_in_channel":
      return "Le bot n'est pas membre de ce canal. Invitez-le avec /invite @SaaS-Radar ou choisissez un canal public.";
    case "channel_not_found":
      return "Canal introuvable. Resélectionnez un canal dans les paramètres Slack.";
    case "invalid_auth":
    case "token_revoked":
      return "Accès Slack révoqué. Reconnectez l'intégration depuis le marketplace.";
    case "missing_scope":
      return "Permissions Slack insuffisantes. Réinstallez l'app avec les scopes chat:write et channels:read.";
    default:
      return errorCode
        ? `Erreur Slack : ${errorCode}`
        : "Impossible d'envoyer le message Slack.";
  }
}
