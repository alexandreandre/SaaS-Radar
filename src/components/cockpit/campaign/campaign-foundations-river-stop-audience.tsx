"use client";

import { useState } from "react";
import {
  shouldHideAudiencePain,
  truncateAtSentence,
  type FoundationsRiverAudienceDraft,
} from "@/lib/campaign/foundations-river";
import { CampaignRiverStopShell } from "@/components/cockpit/campaign/campaign-river-stop-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampaignFoundationsRiverStopAudienceProps = {
  draft: FoundationsRiverAudienceDraft;
  productName: string;
  onConfirm: (payload: FoundationsRiverAudienceDraft) => void;
};

function AudienceField({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm ${muted ? "text-muted-foreground" : "font-medium"}`}>{value}</p>
    </div>
  );
}

export function CampaignFoundationsRiverStopAudience({
  draft,
  productName,
  onConfirm,
}: CampaignFoundationsRiverStopAudienceProps) {
  const [who, setWho] = useState(draft.who);
  const [pain, setPain] = useState(draft.pain);
  const [adjusting, setAdjusting] = useState(false);

  const displayWho = truncateAtSentence(who);
  const hidePain = shouldHideAudiencePain(who, pain);

  return (
    <CampaignRiverStopShell
      title="C'est pour eux"
      subtitle="Pré-rempli depuis votre fiche Idée — ça vous parle ?"
      actionHint="Si c'est correct, validez. Sinon, ajustez en deux champs."
      onConfirm={() =>
        onConfirm({
          who,
          pain,
          icpSummary: `${who.trim()}${pain.trim() ? ` — ${pain.trim()}` : ""}`,
        })
      }
      onAdjust={() => setAdjusting((v) => !v)}
      adjusting={adjusting}
    >
      {!adjusting ? (
        <div className="space-y-4 rounded-lg border border-primary/15 bg-primary/5 p-4">
          <AudienceField label="Qui" value={displayWho} />
          {pain && !hidePain ? <AudienceField label="Leur problème" value={pain} muted /> : null}
          <p className="text-xs text-muted-foreground">
            Pré-rempli depuis votre fiche Idée · {productName}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label htmlFor="river-who">Qui voulez-vous toucher ?</Label>
            <Input id="river-who" className="mt-1.5" value={who} onChange={(e) => setWho(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="river-pain">Quel problème ont-ils ?</Label>
            <textarea
              id="river-pain"
              className="mt-1.5 flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={pain}
              onChange={(e) => setPain(e.target.value)}
            />
          </div>
        </div>
      )}
    </CampaignRiverStopShell>
  );
}
