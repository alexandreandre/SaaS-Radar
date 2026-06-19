export type BrevoConversionMode = "campaign_clicks" | "list_addition";

export type BrevoCredential = {
  apiKey: string;
  conversionMode: BrevoConversionMode;
  conversionListId: string | null;
  conversionListName?: string | null;
  webhookToken: string;
  companyName?: string;
  accountEmail?: string;
};

export type BrevoAccountResponse = {
  email?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
};

export type BrevoContactList = {
  id: number;
  name: string;
  totalSubscribers?: number;
  totalBlacklisted?: number;
};

export type BrevoContact = {
  id: number;
  email: string;
  createdAt: string;
  listIds?: number[];
};

export type BrevoContactsResponse = {
  contacts: BrevoContact[];
  count?: number;
};

export type BrevoListsResponse = {
  lists: BrevoContactList[];
  count?: number;
};

export type BrevoCampaignGlobalStats = {
  uniqueClicks?: number;
  uniqueViews?: number;
  delivered?: number;
  sent?: number;
};

export type BrevoEmailCampaign = {
  id: number;
  name: string;
  status: string;
  sentDate?: string;
  statistics?: {
    globalStats?: BrevoCampaignGlobalStats;
  };
};

export type BrevoEmailCampaignsResponse = {
  campaigns: BrevoEmailCampaign[];
  count?: number;
};

export type BrevoWebhookPayload = {
  id?: number | string;
  email?: string;
  event?: string;
  list_id?: number[];
  date?: string;
  ts?: number;
};

export type ParsedBrevoWebhookEvent = {
  eventId: string;
  eventName: string;
  eventTime: string;
  contactId: string | null;
  listIds: number[];
  payload: BrevoWebhookPayload;
};

export type BrevoStoredEvent = {
  eventName: string;
  eventTime: string;
  contactId: string | null;
  listIds: number[];
};

export type BrevoAccountMeta = {
  accountLabel: string;
  companyName: string | null;
  webhookConfigured: boolean;
  conversionListName: string | null;
  conversionMode: BrevoConversionMode;
};
