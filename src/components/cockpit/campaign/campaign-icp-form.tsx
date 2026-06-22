"use client";

import { useState } from "react";
import type { CampaignIcpStructured } from "@/lib/campaign/kits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function buildIcpSummary(icp: CampaignIcpStructured): string {
  const parts = [
    icp.segment?.trim(),
    icp.size?.trim() ? `(${icp.size.trim()})` : undefined,
    icp.pain?.trim() ? `Douleur : ${icp.pain.trim()}` : undefined,
  ].filter(Boolean);
  return parts.join(" · ");
}

type CampaignIcpFormProps = {
  icp?: CampaignIcpStructured;
  icpSummary?: string;
  onSave: (icp: CampaignIcpStructured, summary: string) => void;
};

export function CampaignIcpForm({ icp, icpSummary, onSave }: CampaignIcpFormProps) {
  const [segment, setSegment] = useState(icp?.segment ?? icpSummary ?? "");
  const [size, setSize] = useState(icp?.size ?? "");
  const [pain, setPain] = useState(icp?.pain ?? "");
  const [trigger, setTrigger] = useState(icp?.trigger ?? "");
  const [champion, setChampion] = useState(icp?.champion ?? "");
  const [economicBuyer, setEconomicBuyer] = useState(icp?.economicBuyer ?? "");

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="icp-segment">Segment ICP</Label>
          <Input id="icp-segment" value={segment} onChange={(e) => setSegment(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="icp-size">Taille / stade</Label>
          <Input id="icp-size" value={size} onChange={(e) => setSize(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="icp-pain">Douleur principale</Label>
        <Input id="icp-pain" value={pain} onChange={(e) => setPain(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="icp-trigger">Déclencheur d&apos;achat</Label>
          <Input id="icp-trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="icp-champion">Champion interne</Label>
          <Input id="icp-champion" value={champion} onChange={(e) => setChampion(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="icp-buyer">Décideur économique</Label>
        <Input
          id="icp-buyer"
          value={economicBuyer}
          onChange={(e) => setEconomicBuyer(e.target.value)}
        />
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          const structured = { segment, size, pain, trigger, champion, economicBuyer };
          onSave(structured, buildIcpSummary(structured) || segment.trim());
        }}
      >
        Enregistrer l&apos;ICP
      </Button>
    </div>
  );
}
