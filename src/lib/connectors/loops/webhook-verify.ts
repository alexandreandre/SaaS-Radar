import crypto from "node:crypto";

export type LoopsWebhookHeaders = {
  eventId: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type LoopsWebhookVerifyResult =
  | { ok: true }
  | { ok: false; code: "MISSING_HEADERS" | "MISSING_SECRET" | "INVALID_SIGNATURE"; message: string };

export function extractLoopsWebhookHeaders(headers: Headers): LoopsWebhookHeaders {
  return {
    eventId: headers.get("webhook-id"),
    timestamp: headers.get("webhook-timestamp"),
    signature: headers.get("webhook-signature"),
  };
}

export function verifyLoopsWebhookSignature(input: {
  eventId: string;
  timestamp: string;
  signatureHeader: string;
  rawBody: string;
  signingSecret: string;
}): LoopsWebhookVerifyResult {
  const { eventId, timestamp, signatureHeader, rawBody, signingSecret } = input;

  if (!eventId || !timestamp || !signatureHeader) {
    return {
      ok: false,
      code: "MISSING_HEADERS",
      message: "En-têtes webhook Loops manquants.",
    };
  }

  const secret = signingSecret.trim();
  if (!secret) {
    return {
      ok: false,
      code: "MISSING_SECRET",
      message: "Secret webhook Loops non configuré.",
    };
  }

  const secretPart = secret.includes("_") ? secret.split("_")[1] : secret;
  if (!secretPart) {
    return {
      ok: false,
      code: "MISSING_SECRET",
      message: "Format de secret webhook Loops invalide.",
    };
  }

  const signedContent = `${eventId}.${timestamp}.${rawBody}`;
  const secretBytes = Buffer.from(secretPart, "base64");
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const signatureFound = signatureHeader
    .split(" ")
    .some((part) => part.includes(`,${expectedSignature}`));

  if (!signatureFound) {
    return {
      ok: false,
      code: "INVALID_SIGNATURE",
      message: "Signature webhook Loops invalide.",
    };
  }

  return { ok: true };
}
