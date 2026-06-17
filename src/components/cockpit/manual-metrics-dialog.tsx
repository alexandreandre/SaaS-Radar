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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

type ManualMetricsDialogProps = {
  onSubmit: (partial: Partial<MetricsSnapshot>) => void;
  /** Champs affichés : overview (défaut) ou produit (engagement). */
  focus?: "overview" | "product";
  trigger?: React.ReactNode;
  className?: string;
};

export function ManualMetricsDialog({
  onSubmit,
  focus = "overview",
  trigger,
  className,
}: ManualMetricsDialogProps) {
  const [open, setOpen] = useState(false);
  const [mrr, setMrr] = useState("");
  const [customers, setCustomers] = useState("");
  const [signups, setSignups] = useState("");
  const [trials, setTrials] = useState("");
  const [mau, setMau] = useState("");
  const [dau, setDau] = useState("");
  const [activeUsers, setActiveUsers] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [conversions, setConversions] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partial: Partial<MetricsSnapshot> = {
      date: new Date().toISOString().slice(0, 7),
      signups: Number(signups) || 0,
      mau: Number(mau) || 0,
    };
    if (focus === "overview") {
      partial.mrr = Number(mrr) || 0;
      partial.customers = Number(customers) || 0;
      partial.adSpend = Number(adSpend) || 0;
      partial.conversions = Number(conversions) || 0;
    } else {
      partial.trials = Number(trials) || 0;
      partial.dau = Number(dau) || 0;
      partial.activeUsers = Number(activeUsers) || 0;
    }
    onSubmit(partial);
    setOpen(false);
  };

  const title = focus === "product" ? "Métriques engagement" : "Métriques du mois";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 gap-1.5 px-2 text-xs font-normal text-muted-foreground hover:text-foreground",
                  className,
                )}
              >
                <PenLine className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Saisie manuelle</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Saisir vos métriques à la main</TooltipContent>
          </Tooltip>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {focus === "overview" ? (
            <>
              <MetricField label="MRR (€)" value={mrr} onChange={setMrr} />
              <MetricField label="Clients" value={customers} onChange={setCustomers} />
              <MetricField label="Signups" value={signups} onChange={setSignups} />
              <MetricField label="MAU" value={mau} onChange={setMau} />
              <MetricField label="Dépenses pub (€)" value={adSpend} onChange={setAdSpend} />
              <MetricField label="Conversions" value={conversions} onChange={setConversions} />
            </>
          ) : (
            <>
              <MetricField label="Signups" value={signups} onChange={setSignups} />
              <MetricField label="Trials" value={trials} onChange={setTrials} />
              <MetricField label="MAU" value={mau} onChange={setMau} />
              <MetricField label="DAU" value={dau} onChange={setDau} />
              <MetricField label="Utilisateurs actifs" value={activeUsers} onChange={setActiveUsers} />
            </>
          )}
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
