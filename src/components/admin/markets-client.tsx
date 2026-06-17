"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-ui";
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton";
import { adminFetchJson } from "@/lib/admin/client-fetch";

type Market = {
  code: string;
  name: string;
  heat_score: number;
  tracked_micro_saas: number;
  scope: string;
  is_manual_override: boolean;
};

export function AdminMarketsClient() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<{ markets?: Market[] }>(
      "/api/admin/markets"
    );
    if (ok) setMarkets(json.markets ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateHeat = async (code: string, heat_score: number) => {
    await adminFetchJson("/api/admin/markets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, heat_score }),
    });
    setLoading(true);
    void load();
  };

  if (loading) {
    return <AdminPageSkeleton kpiCount={0} />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Carte & pays"
        description="Éditer les stats pays (world_markets) — remplace la génération hash pour les overrides admin."
      />
      {markets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucun marché en base. Importez ou créez des entrées via PATCH API.
        </p>
      ) : (
        <AdminTable headers={["Pays", "Code", "Heat", "SaaS suivis", "Scope", "Override", "Actions"]}>
          {markets.map((m) => (
            <tr key={m.code} className="border-t border-border">
              <td className="px-3 py-2">{m.name}</td>
              <td className="px-3 py-2 font-mono text-xs">{m.code}</td>
              <td className="px-3 py-2 tabular-nums">{m.heat_score}</td>
              <td className="px-3 py-2 tabular-nums">{m.tracked_micro_saas}</td>
              <td className="px-3 py-2">{m.scope}</td>
              <td className="px-3 py-2">{m.is_manual_override ? "oui" : "—"}</td>
              <td className="px-3 py-2">
                <Button size="sm" variant="outline" onClick={() => void updateHeat(m.code, m.heat_score + 5)}>
                  +5 heat
                </Button>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
