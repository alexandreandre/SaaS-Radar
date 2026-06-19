import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  decryptCredential,
  encryptCredential,
  isCredentialsEncryptionConfigured,
} from "@/lib/crypto/credentials";

export type ConnectorProvider =
  | "github"
  | "vercel"
  | "netlify"
  | "stripe"
  | "google-ads"
  | "meta-ads"
  | "tiktok-ads"
  | "linkedin-ads"
  | "plausible"
  | "loops"
  | "lemon-squeezy"
  | "brevo"
  | "crisp"
  | "paddle"
  | "freemius"
  | "microsoft-ads"
  | "posthog"
  | "google-analytics"
  | "resend"
  | "intercom"
  | "fathom"
  | "mixpanel"
  | "zendesk"
  | "qonto"
  | "pennylane"
  | "abby"
  | "better-stack"
  | "slack"
  | "sentry"
  | "hubspot"
  | "pipedrive";

export type StoredCredential<T> = {
  provider: ConnectorProvider;
  data: T;
  metadata?: Record<string, unknown>;
};

export async function saveConnectorCredential<T extends Record<string, unknown>>(
  userId: string,
  projectId: string,
  provider: ConnectorProvider,
  data: T,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!isCredentialsEncryptionConfigured()) {
    throw new Error("Chiffrement des credentials non configuré");
  }

  const supabase = createAdminClient();
  const encrypted = encryptCredential(JSON.stringify(data));

  const { error } = await supabase.from("connector_credentials").upsert(
    {
      user_id: userId,
      project_id: projectId,
      provider,
      credential_encrypted: encrypted,
      metadata: metadata ?? {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id,provider" },
  );

  if (error) throw error;
}

export async function loadConnectorCredential<T extends Record<string, unknown>>(
  userId: string,
  projectId: string,
  provider: ConnectorProvider,
): Promise<StoredCredential<T> | null> {
  if (!isCredentialsEncryptionConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_credentials")
    .select("credential_encrypted, metadata")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw error;
  if (!data?.credential_encrypted) return null;

  const parsed = JSON.parse(decryptCredential(data.credential_encrypted)) as T;
  return {
    provider,
    data: parsed,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  };
}

export async function deleteConnectorCredential(
  userId: string,
  projectId: string,
  provider: ConnectorProvider,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("connector_credentials")
    .delete()
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("provider", provider);
  if (error) throw error;
}

export async function loadConnectorCredentialByProject<T extends Record<string, unknown>>(
  projectId: string,
  provider: ConnectorProvider,
): Promise<T | null> {
  if (!isCredentialsEncryptionConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_credentials")
    .select("credential_encrypted")
    .eq("project_id", projectId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw error;
  if (!data?.credential_encrypted) return null;

  return JSON.parse(decryptCredential(data.credential_encrypted)) as T;
}

export type ConnectorCredentialRow = {
  userId: string;
  projectId: string;
  provider: ConnectorProvider;
};

export async function listAllConnectorCredentials(): Promise<ConnectorCredentialRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("connector_credentials")
    .select("user_id, project_id, provider");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    userId: row.user_id as string,
    projectId: row.project_id as string,
    provider: row.provider as ConnectorProvider,
  }));
}
