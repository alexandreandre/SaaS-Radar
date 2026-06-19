export function verifyBrevoWebhookToken(
  providedToken: string | null | undefined,
  expectedToken: string,
): { ok: true } | { ok: false; message: string } {
  if (!providedToken?.trim()) {
    return { ok: false, message: "Token webhook manquant." };
  }
  if (providedToken.trim() !== expectedToken.trim()) {
    return { ok: false, message: "Token webhook invalide." };
  }
  return { ok: true };
}
