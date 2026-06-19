import crypto from "node:crypto";

export type SentryWebhookVerifyResult =
  | { ok: true }
  | { ok: false; message: string };

export function verifySentryWebhookSignature(input: {
  rawBody: string;
  signature: string | null;
  clientSecret: string;
}): SentryWebhookVerifyResult {
  const { rawBody, signature, clientSecret } = input;
  if (!signature?.trim()) {
    return { ok: false, message: "En-tête Sentry-Hook-Signature manquant." };
  }

  const secret = clientSecret.trim();
  if (!secret) {
    return { ok: false, message: "Secret webhook Sentry non configuré." };
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature.trim(), "utf8");

  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return { ok: false, message: "Signature webhook Sentry invalide." };
  }

  return { ok: true };
}
