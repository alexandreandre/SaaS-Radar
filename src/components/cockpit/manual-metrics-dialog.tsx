"use client";

import { useState } from "react";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PenLine } from "lucide-react";

type ManualMetricsDialogProps = {
  onSubmit: (partial: Partial<MetricsSnapshot>) => void;
};

export function ManualMetricsDialog({ onSubmit }: ManualMetricsDialogProps) {
  const [open, setOpen] = useState(false);
  const [mrr, setMrr] = useState("");
  const [customers, setCustomers] = useState("");
  const [signups, setSignups] = useState("");
  const [mau, setMau] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [conversions, setConversions] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date: new Date().toISOString().slice(0, 7),
      mrr: Number(mrr) || 0,
      customers: Number(customers) || 0,
      signups: Number(signups) || 0,
      mau: Number(mau) || 0,
      adSpend: Number(adSpend) || 0,
      conversions: Number(conversions) || 0,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PenLine className="h-4 w-4" />
          Saisie manuelle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Métriques du mois</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <MetricField label="MRR (€)" value={mrr} onChange={setMrr} />
          <MetricField label="Clients" value={customers} onChange={setCustomers} />
          <MetricField label="Signups" value={signups} onChange={setSignups} />
          <MetricField label="MAU" value={mau} onChange={setMau} />
          <MetricField label="Dépenses pub (€)" value={adSpend} onChange={setAdSpend} />
          <MetricField label="Conversions" value={conversions} onChange={setConversions} />
          <DialogFooter className="sm:col-span-2">
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MetricField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
      />
    </div>
  );
}
