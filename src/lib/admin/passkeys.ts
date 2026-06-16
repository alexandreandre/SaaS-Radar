/**
 * Phase B — Passkeys / WebAuthn pour l'admin.
 * Supabase Auth supporte les passkeys via le provider WebAuthn (dashboard Supabase).
 * Ce module prépare l'intégration côté app sans bloquer le MVP MFA TOTP.
 */

export type PasskeyConfig = {
  /** Sous-domaine admin isolé (ex. admin.saasradar.fr) */
  adminSubdomain: string | null;
  /** Active les passkeys comme facteur principal */
  passkeysEnabled: boolean;
};

export function getPasskeyConfig(): PasskeyConfig {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? null;
  return {
    adminSubdomain: adminUrl,
    passkeysEnabled: process.env.NEXT_PUBLIC_ADMIN_PASSKEYS === "1",
  };
}

export function isAdminSubdomainRequest(host: string | null): boolean {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
  if (!adminUrl || !host) return false;
  try {
    const adminHost = new URL(adminUrl).host;
    return host === adminHost || host.startsWith(`admin.`);
  } catch {
    return false;
  }
}
