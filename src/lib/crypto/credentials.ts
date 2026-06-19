import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!raw || raw.length < 16) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY manquant ou trop court (min 16 car.)");
  }
  return scryptSync(raw, "saas-radar-credentials", 32);
}

export function encryptCredential(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptCredential(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Credential chiffrée invalide");
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  try {
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error(
      "Impossible de déchiffrer les credentials (clé CREDENTIALS_ENCRYPTION_KEY modifiée ?). Reconnectez le connecteur.",
    );
  }
}

export function isCredentialsEncryptionConfigured(): boolean {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY;
  return Boolean(raw && raw.length >= 16);
}
