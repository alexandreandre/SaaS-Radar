"use client";

import type { CampaignContentAsset } from "@/lib/campaign/kits";
import { CONTENT_ASSET_SCHEMAS } from "@/lib/campaign/content-schemas";
import { CampaignContentField } from "@/components/cockpit/campaign/content/campaign-content-field";

type CampaignContentAssetPanelProps = {
  asset: CampaignContentAsset;
  editing: boolean;
  fieldValues: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
};

export function CampaignContentAssetPanel({
  asset,
  editing,
  fieldValues,
  onFieldChange,
}: CampaignContentAssetPanelProps) {
  const schema = CONTENT_ASSET_SCHEMAS[asset.id];

  return (
    <div className="space-y-4">
      {asset.fields.map((field) => {
        const schemaField = schema?.fields.find((f) => f.key === field.key);
        return (
          <CampaignContentField
            key={field.key}
            fieldKey={`${asset.id}-${field.key}`}
            label={field.label}
            value={fieldValues[field.key] ?? field.value}
            maxLength={field.maxLength ?? schemaField?.maxLength}
            hint={field.hint ?? schemaField?.hint}
            multiline={schemaField?.multiline}
            editing={editing}
            onChange={(v) => onFieldChange(field.key, v)}
          />
        );
      })}
    </div>
  );
}
