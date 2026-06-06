"use client";

import { useEffect, useState } from "react";
import type { AdCampaign } from "@/lib/connectors/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CampaignFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AdCampaign | null;
  onSubmit: (data: Omit<AdCampaign, "id">) => void;
};

export function CampaignFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: CampaignFormDialogProps) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<AdCampaign["channel"]>("google");
  const [dailyBudget, setDailyBudget] = useState("25");
  const [totalSpend, setTotalSpend] = useState("0");
  const [impressions, setImpressions] = useState("0");
  const [clicks, setClicks] = useState("0");
  const [conversions, setConversions] = useState("0");

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setChannel(initial.channel);
      setDailyBudget(String(initial.dailyBudget));
      setTotalSpend(String(initial.totalSpend));
      setImpressions(String(initial.impressions));
      setClicks(String(initial.clicks));
      setConversions(String(initial.conversions));
    } else {
      setName("");
      setChannel("google");
      setDailyBudget("25");
      setTotalSpend("0");
      setImpressions("0");
      setClicks("0");
      setConversions("0");
    }
  }, [initial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      channel,
      status: initial?.status ?? "active",
      dailyBudget: Number(dailyBudget) || 0,
      totalSpend: Number(totalSpend) || 0,
      impressions: Number(impressions) || 0,
      clicks: Number(clicks) || 0,
      conversions: Number(conversions) || 0,
      startedAt: initial?.startedAt ?? new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nom" value={name} onChange={setName} />
          <div className="space-y-2">
            <Label>Canal</Label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as AdCampaign["channel"])}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="google">Google</option>
              <option value="meta">Meta</option>
              <option value="linkedin">LinkedIn</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <Field label="Budget journalier (€)" value={dailyBudget} onChange={setDailyBudget} type="number" />
          <Field label="Total dépensé (€)" value={totalSpend} onChange={setTotalSpend} type="number" />
          <Field label="Impressions" value={impressions} onChange={setImpressions} type="number" />
          <Field label="Clics" value={clicks} onChange={setClicks} type="number" />
          <Field label="Conversions" value={conversions} onChange={setConversions} type="number" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
      />
    </div>
  );
}
