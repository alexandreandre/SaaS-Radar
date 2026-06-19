import crypto from "node:crypto";

export type ResendWebhookHeaders = {
  eventId: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type ResendWebhookVerifyResult =
  | { ok: true }
  | { ok: false; code: "MISSING_HEADERS" | "MISSING_SECRET" | "INVALID_SIGNATURE"; message: string };

export function extractResendWebhookHeaders(headers: Headers): ResendWebhookHeaders {
  return {
    eventId: headers.get("svix-id"),
    timestamp: headers.get("svix-timestamp"),
    signature: headers.get("svix-signature"),
  };
}

export function verifyResendWebhookSignature(input: {
  eventId: string;
  timestamp: string;
  signatureHeader: string;
  rawBody: string;
  signingSecret: string;
}): ResendWebhookVerifyResult {
  const { eventId, timestamp, signatureHeader, rawBody, signingSecret } = input;

  if (!eventId || !timestamp || !signatureHeader) {
    return {
      ok: false,
      code: "MISSING_HEADERS",
      message: "En-têtes webhook Resend manquants (svix-id, svix-timestamp, svix-signature).",
    };
  }

  const secret = signingSecret.trim();
  if (!secret) {
    return {
      ok: false,
      code: "MISSING_SECRET",
      message: "Secret webhook Resend non configuré.",
    };
  }

  const secretPart = secret.includes("_") ? secret.split("_")[1] : secret;
  if (!secretPart) {
    return {
      ok: false,
      code: "MISSING_SECRET",
      message: "Format de secret webhook Resend invalide.",
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
      message: "Signature webhook Resend invalide.",
    };
  }

  return { ok: true };
}
