export type LoopsConversionMode = "mailing_list" | "email_clicked";

export type LoopsCredential = {
  apiKey: string;
  webhookSigningSecret: string;
  conversionListId?: string | null;
  conversionMode: LoopsConversionMode;
  teamName?: string;
};

export type LoopsAccountMeta = {
  accountLabel: string;
  webhookConfigured: boolean;
  conversionListName?: string | null;
};

export type LoopsMailingList = {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
};

export type LoopsApiKeyResponse = {
  success: boolean;
  teamName?: string;
  message?: string;
  error?: string;
};

export type LoopsContactIdentity = {
  id?: string;
  email?: string;
  userId?: string | null;
};

export type LoopsWebhookPayload = {
  eventName?: string;
  eventTime?: number;
  webhookSchemaVersion?: string;
  contactIdentity?: LoopsContactIdentity;
  mailingList?: {
    id?: string;
    name?: string;
  };
};

export type LoopsStoredEvent = {
  eventName: string;
  eventTime: string;
  contactId: string | null;
  mailingListId: string | null;
};

export type ParsedLoopsWebhookEvent = {
  eventId: string;
  eventName: string;
  eventTime: string;
  contactId: string | null;
  mailingListId: string | null;
  payload: LoopsWebhookPayload;
};
