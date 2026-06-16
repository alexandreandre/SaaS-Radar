import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import {
  DEFAULT_PUBLISH_SETTINGS,
  type AutoPublishRule,
  type SourcingSettings,
  evaluateAutoPublish,
  simulateRulesOnDrafts,
} from "@/lib/admin/publish-policy.shared";

export type {
  AutoPublishRule,
  AutoPublishRuleConditions,
  AutoPublishEvaluation,
  SourcingSettings,
} from "@/lib/admin/publish-policy.shared";
export { RULE_PRESETS, evaluateAutoPublish, simulateRulesOnDrafts } from "@/lib/admin/publish-policy.shared";

function parseRules(raw: Json): AutoPublishRule[] {
  if (!Array.isArray(raw)) return [];
  return raw as unknown as AutoPublishRule[];
}

export async function loadPublishSettings(): Promise<SourcingSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("sourcing_settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (error || !data) return DEFAULT_PUBLISH_SETTINGS;
    return {
      id: data.id as string,
      default_mode: (data.default_mode as "draft" | "direct") ?? "direct",
      auto_publish_enabled: data.auto_publish_enabled === true,
      auto_publish_rules: parseRules(data.auto_publish_rules),
      notify_on_pending: data.notify_on_pending === true,
      monthly_cost_cap_usd:
        data.monthly_cost_cap_usd != null ? Number(data.monthly_cost_cap_usd) : null,
      discovery_model: (data.discovery_model as string | null) ?? null,
      structure_model: (data.structure_model as string | null) ?? null,
      updated_by: (data.updated_by as string | null) ?? null,
      updated_at: (data.updated_at as string) ?? new Date().toISOString(),
    };
  } catch {
    return DEFAULT_PUBLISH_SETTINGS;
  }
}

export async function savePublishSettings(
  patch: Partial<
    Pick<
      SourcingSettings,
      | "auto_publish_enabled"
      | "auto_publish_rules"
      | "notify_on_pending"
      | "monthly_cost_cap_usd"
      | "default_mode"
      | "discovery_model"
      | "structure_model"
    >
  >,
  updatedBy?: string
): Promise<SourcingSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sourcing_settings")
    .upsert(
      {
        id: "default",
        ...patch,
        updated_by: updatedBy ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id as string,
    default_mode: (data.default_mode as "draft" | "direct") ?? "direct",
    auto_publish_enabled: data.auto_publish_enabled === true,
    auto_publish_rules: parseRules(data.auto_publish_rules),
    notify_on_pending: data.notify_on_pending === true,
    monthly_cost_cap_usd:
      data.monthly_cost_cap_usd != null ? Number(data.monthly_cost_cap_usd) : null,
    discovery_model: (data.discovery_model as string | null) ?? null,
    structure_model: (data.structure_model as string | null) ?? null,
    updated_by: (data.updated_by as string | null) ?? null,
    updated_at: (data.updated_at as string) ?? new Date().toISOString(),
  };
}
