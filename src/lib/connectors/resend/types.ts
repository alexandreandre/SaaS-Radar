export type ResendConversionMode = "email_clicked" | "segment";

export type ResendCredential = {
  apiKey: string;
  webhookSigningSecret: string;
  conversionMode: ResendConversionMode;
  conversionSegmentId?: string | null;
  conversionSegmentName?: string | null;
  accountDomain?: string;
};

export type ResendAccountMeta = {
  accountLabel: string;
  webhookConfigured: boolean;
  conversionSegmentName?: string | null;
  conversionMode: ResendConversionMode;
};

export type ResendDomain = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  region?: string;
};

export type ResendSegment = {
  id: string;
  name: string;
  created_at: string;
};

export type ResendContact = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at: string;
  unsubscribed?: boolean;
};

export type ResendListResponse<T> = {
  object: "list";
  has_more: boolean;
  data: T[];
};

export type ResendWebhookPayload = {
  type?: string;
  created_at?: string;
  data?: {
    id?: string;
    email?: string;
    created_at?: string;
    segment_ids?: string[];
    to?: string[];
    click?: {
      timestamp?: string;
      link?: string;
    };
  };
};

export type ResendStoredEvent = {
  eventName: string;
  eventTime: string;
  contactId: string | null;
  segmentId: string | null;
  recipientEmail: string | null;
};

export type ParsedResendWebhookEvent = {
  eventId: string;
  eventName: string;
  eventTime: string;
  contactId: string | null;
  segmentId: string | null;
  recipientEmail: string | null;
  payload: ResendWebhookPayload;
};
