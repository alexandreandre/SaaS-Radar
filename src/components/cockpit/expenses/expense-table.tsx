"use client";

import { useState } from "react";
import type { Expense } from "@/lib/connectors/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExpenseFormDialog } from "@/components/cockpit/expenses/expense-form-dialog";
import { Plus, Trash2 } from "lucide-react";

type ExpenseTableProps = {
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, "id">) => void;
  onRemove: (id: string) => void;
};

const CATEGORY_LABELS: Record<Expense["category"], string> = {
  infra: "Infra",
  ads: "Pubs",
  tools: "Outils",
  salary: "Salaires",
  other: "Autre",
};

export function ExpenseTable({ expenses, onAdd, onRemove }: ExpenseTableProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter une dépense
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Libellé</th>
              <th className="pb-2 font-medium">Catégorie</th>
              <th className="pb-2 font-medium">Montant</th>
              <th className="pb-2 font-medium">Récurrent</th>
              <th className="pb-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{e.label}</td>
                <td className="py-3">{CATEGORY_LABELS[e.category]}</td>
                <td className="py-3 font-data">{formatCurrency(e.amount)}</td>
                <td className="py-3">{e.recurring ? "Oui" : "Non"}</td>
                <td className="py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={() => onRemove(e.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ExpenseFormDialog open={open} onOpenChange={setOpen} onSubmit={onAdd} />
    </>
  );
}
