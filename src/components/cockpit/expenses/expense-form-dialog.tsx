"use client";

import { useState } from "react";
import type { Expense } from "@/lib/connectors/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (expense: Omit<Expense, "id">) => void;
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("tools");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      label,
      category,
      amount: Number(amount) || 0,
      recurring,
      date: new Date().toISOString().slice(0, 10),
    });
    setLabel("");
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Libellé</Label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Expense["category"])}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="infra">Infra</option>
              <option value="ads">Pubs</option>
              <option value="tools">Outils</option>
              <option value="salary">Salaires</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Montant (€)</Label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={recurring} onCheckedChange={(v) => setRecurring(!!v)} />
            Dépense récurrente (mensuelle)
          </label>
          <DialogFooter>
            <Button type="submit">Ajouter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
