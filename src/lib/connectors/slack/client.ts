import "server-only";

import { mapSlackPostError } from "@/lib/connectors/slack/alert-dispatch";
import type {
  SlackAuthTestResponse,
  SlackChannelSummary,
  SlackChatPostMessageResponse,
  SlackConversationsListResponse,
  SlackCredential,
} from "@/lib/connectors/slack/types";

const SLACK_API = "https://slack.com/api";

export class SlackConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SlackConnectorError";
    this.status = status;
  }
}

async function slackRequest<T extends { ok: boolean; error?: string }>(
  method: string,
  token: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as T;
  if (!res.ok || !data.ok) {
    const message = mapSlackPostError(data.error);
    throw new SlackConnectorError(message, res.status >= 400 && res.status < 600 ? res.status : 502);
  }

  return data;
}

export async function authTest(token: string): Promise<SlackAuthTestResponse> {
  return slackRequest<SlackAuthTestResponse>("auth.test", token);
}

export async function listPostableChannels(token: string): Promise<SlackChannelSummary[]> {
  const channels: SlackChannelSummary[] = [];
  let cursor: string | undefined;

  do {
    const data = await slackRequest<SlackConversationsListResponse>("conversations.list", token, {
      exclude_archived: true,
      types: "public_channel,private_channel",
      limit: 200,
      ...(cursor ? { cursor } : {}),
    });

    for (const channel of data.channels ?? []) {
      if (!channel.id || !channel.name) continue;
      channels.push({
        id: channel.id,
        name: channel.is_private ? `#${channel.name}` : `#${channel.name}`,
        isPrivate: channel.is_private === true,
      });
    }

    cursor = data.response_metadata?.next_cursor?.trim() || undefined;
  } while (cursor);

  channels.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return channels;
}

export async function postMessage(
  token: string,
  channelId: string,
  payload: { text: string; blocks?: Record<string, unknown>[] },
): Promise<SlackChatPostMessageResponse> {
  return slackRequest<SlackChatPostMessageResponse>("chat.postMessage", token, {
    channel: channelId,
    text: payload.text,
    ...(payload.blocks ? { blocks: payload.blocks } : {}),
  });
}

export async function validateSlackCredential(
  credential: SlackCredential,
): Promise<{ accountLabel: string; credential: SlackCredential }> {
  if (!credential.botAccessToken?.trim()) {
    throw new SlackConnectorError("Token Slack manquant", 400);
  }

  const auth = await authTest(credential.botAccessToken);
  const next: SlackCredential = {
    ...credential,
    teamId: auth.team_id ?? credential.teamId,
    teamName: auth.team ?? credential.teamName,
    botUserId: auth.user_id ?? credential.botUserId,
  };

  return {
    accountLabel: buildSlackAccountLabelFromCredential(next),
    credential: next,
  };
}

function buildSlackAccountLabelFromCredential(credential: SlackCredential): string {
  const channel = credential.channelName?.trim();
  const team = credential.teamName?.trim() || "Slack";
  if (channel) return `${channel} · ${team}`;
  return team;
}

export { buildSlackAccountLabelFromCredential as buildSlackAccountLabel };
