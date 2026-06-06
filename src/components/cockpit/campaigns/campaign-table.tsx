"use client";

import { useState } from "react";
import type { AdCampaign } from "@/lib/connectors/types";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CampaignFormDialog } from "@/components/cockpit/campaigns/campaign-form-dialog";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";

type CampaignTableProps = {
  campaigns: AdCampaign[];
  onAdd: (campaign: Omit<AdCampaign, "id">) => void;
  onUpdate: (id: string, patch: Partial<AdCampaign>) => void;
  onRemove: (id: string) => void;
};

export function CampaignTable({ campaigns, onAdd, onUpdate, onRemove }: CampaignTableProps) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<AdCampaign | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEdit(null); setOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Campagne</th>
              <th className="pb-2 font-medium">Canal</th>
              <th className="pb-2 font-medium">Budget/j</th>
              <th className="pb-2 font-medium">Dépensé</th>
              <th className="pb-2 font-medium">CTR</th>
              <th className="pb-2 font-medium">Conv.</th>
              <th className="pb-2 font-medium">CAC</th>
              <th className="pb-2 font-medium">ROAS</th>
              <th className="pb-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "—";
              const cac = c.conversions > 0 ? formatCurrency(c.totalSpend / c.conversions) : "—";
              const roas =
                c.totalSpend > 0
                  ? `${Math.round(((c.conversions * 79) / c.totalSpend) * 10) / 10}x`
                  : "—";
              return (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium">{c.name}</td>
                  <td className="py-3 capitalize">{c.channel}</td>
                  <td className="py-3 font-data">{formatCurrency(c.dailyBudget)}</td>
                  <td className="py-3 font-data">{formatCurrency(c.totalSpend)}</td>
                  <td className="py-3">{ctr !== "—" ? `${ctr} %` : ctr}</td>
                  <td className="py-3">{c.conversions}</td>
                  <td className="py-3">{cac}</td>
                  <td className="py-3">{roas}</td>
                  <td className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEdit(c);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onRemove(c.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {campaigns.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Aucune campagne.</p>
        ) : null}
      </div>

      <CampaignFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={edit}
        onSubmit={(data) => {
          if (edit) onUpdate(edit.id, data);
          else onAdd(data);
          setOpen(false);
        }}
      />
    </>
  );
}
