export type SlackCredential = {
  botAccessToken: string;
  teamId: string;
  teamName: string;
  botUserId?: string;
  appId?: string;
  scopes?: string;
  channelId?: string;
  channelName?: string;
  alertsSent?: number;
  lastAlertAt?: string | null;
  deliveredAlertIds?: string[];
};

export type SlackChannelSummary = {
  id: string;
  name: string;
  isPrivate: boolean;
};

export type SlackOAuthAccessResponse = {
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: { id?: string; name?: string };
  error?: string;
};

export type SlackApiResponse = {
  ok: boolean;
  error?: string;
  needed?: string;
  provided?: string;
};

export type SlackAuthTestResponse = SlackApiResponse & {
  team_id?: string;
  team?: string;
  user_id?: string;
  bot_id?: string;
};

export type SlackConversation = {
  id: string;
  name?: string;
  is_private?: boolean;
};

export type SlackConversationsListResponse = SlackApiResponse & {
  channels?: SlackConversation[];
  response_metadata?: { next_cursor?: string };
};

export type SlackChatPostMessageResponse = SlackApiResponse & {
  channel?: string;
  ts?: string;
};

export const SLACK_DELIVERED_ALERT_IDS_MAX = 50;

export const SLACK_BOT_SCOPES = [
  "chat:write",
  "channels:read",
  "groups:read",
  "chat:write.public",
] as const;
