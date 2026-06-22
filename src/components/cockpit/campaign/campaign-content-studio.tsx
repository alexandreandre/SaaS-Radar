"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignContentAsset } from "@/lib/campaign/kits";
import {
  buildContentDeriveContext,
  resolveContentAssets,
} from "@/lib/campaign/content-derive";
import {
  assetFieldsMap,
  fieldsToRecord,
  getRequiredContentAssetIds,
  isContentAssetConfirmed,
  validateContentAsset,
} from "@/lib/campaign/content-schemas";
import { CONTENT_STUDIO_PHASE_SUBTITLE } from "@/lib/campaign/content-constants";
import { CampaignGuidedStep } from "@/components/cockpit/campaign/campaign-guided-step";
import { CampaignContentAssetPanel } from "@/components/cockpit/campaign/content/campaign-content-asset-panel";
import { CampaignContentCopyAll } from "@/components/cockpit/campaign/content/campaign-content-copy-all";
import { Button } from "@/components/ui/button";
import { contentAssetAnchorId } from "@/lib/campaign/content-constants";

type CampaignContentStudioProps = {
  project: UserProject;
  opportunity: Opportunity;
  onStartStudio: () => void;
  onConfirmAsset: (assetId: string, fields: Record<string, string>) => void;
  onContinue?: () => void;
  creationComplete: boolean;
};

export function CampaignContentStudio({
  project,
  opportunity,
  onStartStudio,
  onConfirmAsset,
  onContinue,
  creationComplete,
}: CampaignContentStudioProps) {
  const ctx = useMemo(
    () => buildContentDeriveContext(project, opportunity),
    [project, opportunity],
  );
  const assetsMap = useMemo(
    () => resolveContentAssets(project.campaignSetup, ctx),
    [project.campaignSetup, ctx],
  );
  const requiredIds = useMemo(
    () => getRequiredContentAssetIds(ctx.primaryChannel, ctx.supportChannels),
    [ctx.primaryChannel, ctx.supportChannels],
  );

  const [activeId, setActiveId] = useState(requiredIds[0] ?? "landing");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const studioStarted = Boolean(project.campaignSetup?.contentStudio?.startedAt);

  useEffect(() => {
    if (!studioStarted) onStartStudio();
  }, [studioStarted, onStartStudio]);

  useEffect(() => {
    if (!requiredIds.includes(activeId)) {
      setActiveId(requiredIds[0] ?? "landing");
    }
  }, [requiredIds, activeId]);

  const getFieldValues = useCallback(
    (asset: CampaignContentAsset) => {
      const draft = drafts[asset.id];
      if (draft) return { ...assetFieldsMap(asset), ...draft };
      return assetFieldsMap(asset);
    },
    [drafts],
  );

  function handleFieldChange(assetId: string, key: string, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [assetId]: { ...(prev[assetId] ?? assetFieldsMap(assetsMap[assetId]!)), [key]: value },
    }));
  }

  function handleConfirm(assetId: string) {
    const asset = assetsMap[assetId];
    if (!asset) return;
    const values = getFieldValues(asset);
    const tempAsset: CampaignContentAsset = {
      ...asset,
      fields: asset.fields.map((f) => ({ ...f, value: values[f.key] ?? f.value })),
    };
    const { valid, errors } = validateContentAsset(tempAsset);
    if (!valid) {
      setConfirmError(errors[0] ?? "Complétez les champs requis.");
      return;
    }

    setConfirmError(null);
    onConfirmAsset(assetId, values);
    setEditingId(null);
    const idx = requiredIds.indexOf(assetId);
    if (idx >= 0 && idx < requiredIds.length - 1) {
      setActiveId(requiredIds[idx + 1]!);
    }
  }

  const confirmedCount = requiredIds.filter((id) => {
    const a = assetsMap[id];
    return a && isContentAssetConfirmed(a);
  }).length;

  return (
    <section id="creation-content-studio" className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Phase 2 · Création</p>
        <h3 className="mt-1 text-lg font-semibold">Vos contenus prêts à publier</h3>
        <p className="mt-1 text-sm text-muted-foreground">{CONTENT_STUDIO_PHASE_SUBTITLE}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {confirmedCount}/{requiredIds.length} contenus validés · fil rouge :{" "}
          <span className="italic">{ctx.positioning.slice(0, 80)}{ctx.positioning.length > 80 ? "…" : ""}</span>
        </p>
      </div>

      {requiredIds.map((assetId, index) => {
        const asset = assetsMap[assetId];
        if (!asset) return null;
        const values = getFieldValues(asset);
        const previewAsset: CampaignContentAsset = {
          ...asset,
          fields: asset.fields.map((f) => ({ ...f, value: values[f.key] ?? f.value })),
        };
        const done = isContentAssetConfirmed(assetsMap[assetId]!);
        const isEditing = editingId === assetId;
        const isActive = activeId === assetId;

        return (
          <CampaignGuidedStep
            key={assetId}
            id={contentAssetAnchorId(assetId)}
            step={index + 1}
            title={asset.label}
            done={done}
            defaultOpen={isActive}
          >
            <CampaignContentAssetPanel
              asset={previewAsset}
              editing={isEditing}
              fieldValues={values}
              onFieldChange={(key, value) => handleFieldChange(assetId, key, value)}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CampaignContentCopyAll asset={previewAsset} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmError(null);
                  setEditingId(isEditing ? null : assetId);
                }}
              >
                {isEditing ? "Terminer l'ajustement" : "Ajuster"}
              </Button>
              {!done ? (
                <Button type="button" size="sm" onClick={() => handleConfirm(assetId)}>
                  C&apos;est prêt
                </Button>
              ) : (
                <span className="text-xs text-emerald-700 dark:text-emerald-300">Validé</span>
              )}
            </div>
            {confirmError && isActive ? (
              <p className="mt-2 text-xs text-destructive">{confirmError}</p>
            ) : null}
          </CampaignGuidedStep>
        );
      })}

      {creationComplete && onContinue ? (
        <div className="flex justify-end">
          <Button type="button" onClick={onContinue}>
            Continuer → Diffusion
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          Validez chaque contenu avec « C&apos;est prêt » pour passer à la diffusion.
        </p>
      )}
    </section>
  );
}
