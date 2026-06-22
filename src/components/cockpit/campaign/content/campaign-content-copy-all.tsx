"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { CampaignContentAsset } from "@/lib/campaign/kits";
import { formatContentAssetAsMarkdown } from "@/lib/campaign/content-derive";
import { Button } from "@/components/ui/button";

type CampaignContentCopyAllProps = {
  asset: CampaignContentAsset;
};

export function CampaignContentCopyAll({ asset }: CampaignContentCopyAllProps) {
  const [copied, setCopied] = useState(false);
  const text = formatContentAssetAsMarkdown(asset);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void handleCopy()}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copié" : "Copier tout le bloc"}
    </Button>
  );
}
