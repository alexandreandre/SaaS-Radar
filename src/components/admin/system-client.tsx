"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SECTORS } from "@/lib/sourcing/constants";
import { sectorLabels } from "@/data/opportunities";
import { CountryMultiSelect, type CountryOption } from "@/components/admin/country-multi-select";

type Schedule = {
  id: string;
  cron_expr: string;
  count: number;
  enabled: boolean;
  sector: string | null;
  premium: boolean;
  min_score: number | null;
  country_codes: string[];
  config?: { weeklyPick?: boolean; nicheHints?: string[] };
};

export function AdminSystemClient() {
  const [data, setData] = useState<{
    checks?: Record<string, boolean>;
    recoveredStaleRuns?: number;
    recentErrors?: { id: string; error: string; started_at: string }[];
    schedules?: Schedule[];
    monthCostUsd?: number;
    costAlert?: boolean;
  }>({});
  const [scheduleForm, setScheduleForm] = useState<Schedule | null>(null);
  const [cronMarkets, setCronMarkets] = useState<CountryOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [sysRes, policyRes, marketsRes] = await Promise.all([
      fetch("/api/admin/system"),
      fetch("/api/admin/sourcing/policy"),
      fetch("/api/admin/markets"),
    ]);
    const sysJson = await sysRes.json();
    const policyJson = await policyRes.json();
    const marketsJson = await marketsRes.json();
    if (sysRes.ok) {
      setData({
        ...sysJson,
        monthCostUsd: policyJson.monthCostUsd,
        costAlert: policyJson.costAlert,
      });
      if (sysJson.schedules?.[0]) {
        const s = sysJson.schedules[0] as Schedule;
        setScheduleForm({
          ...s,
          country_codes: s.country_codes ?? [],
        });
      }
    }
    if (marketsRes.ok) {
      setCronMarkets(
        (marketsJson.markets ?? []).map((m: CountryOption) => ({
          code: m.code,
          name: m.name,
          flag: m.flag,
        }))
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revalidate = async () => {
    await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revalidate" }),
    });
    setMessage("Cache revalidé");
  };

  const saveSchedule = async () => {
    if (!scheduleForm) return;
    const res = await fetch("/api/admin/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_schedule",
        ...scheduleForm,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setMessage("Planification enregistrée");
      void load();
    } else {
      setMessage(json.error ?? "Erreur");
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Système & santé"
        description="Statut des services, erreurs récentes et planification sourcing."
        actions={
          <Button variant="outline" onClick={() => void revalidate()}>
            Revalider le cache
          </Button>
        }
      />

      {data.costAlert && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
          Alerte coût sourcing : {data.monthCostUsd?.toFixed(2)} USD ce mois (plafond dépassé).
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {data.checks &&
          Object.entries(data.checks).map(([key, ok]) => (
            <div key={key} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium capitalize">{key}</p>
              <p className={`mt-1 text-sm ${ok ? "text-emerald-600" : "text-red-600"}`}>
                {ok ? "OK" : "Manquant"}
              </p>
            </div>
          ))}
      </div>

      {typeof data.recoveredStaleRuns === "number" && data.recoveredStaleRuns > 0 && (
        <p className="mt-4 text-sm text-amber-600">
          {data.recoveredStaleRuns} run(s) orphelin(s) récupéré(s).
        </p>
      )}

      {scheduleForm && (
        <section className="mt-8 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium">Planification sourcing (cron)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            GitHub Actions lit cette config via Supabase — un run indépendant par pays,{" "}
            {scheduleForm.count} fiche(s) par pays.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-xs text-muted-foreground">Expression cron</span>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={scheduleForm.cron_expr}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, cron_expr: e.target.value })
                }
              />
            </label>
            <label className="text-sm">
              <span className="text-xs text-muted-foreground">Nombre de fiches</span>
              <input
                type="number"
                min={1}
                max={10}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={scheduleForm.count}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    count: Number.parseInt(e.target.value, 10) || 1,
                  })
                }
              />
            </label>
            <label className="text-sm">
              <span className="text-xs text-muted-foreground">Secteur</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={scheduleForm.sector ?? ""}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    sector: e.target.value || null,
                  })
                }
              >
                <option value="">Tous</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {sectorLabels[s] ?? s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-xs text-muted-foreground">Score min</span>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={scheduleForm.min_score ?? ""}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    min_score: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
          </div>
          <div className="mt-4">
            <CountryMultiSelect
              markets={cronMarkets}
              selected={scheduleForm.country_codes ?? []}
              onChange={(codes) =>
                setScheduleForm({ ...scheduleForm, country_codes: codes })
              }
              max={5}
              min={0}
              label="Pays du cron (max 5)"
              hint="Chaque pays lance un run indépendant avec le nombre de fiches configuré."
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={scheduleForm.enabled}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, enabled: e.target.checked })
                }
              />
              Actif
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={scheduleForm.config?.weeklyPick === true}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    config: { ...scheduleForm.config, weeklyPick: e.target.checked },
                  })
                }
              />
              Weekly pick après cron
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={scheduleForm.premium}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, premium: e.target.checked })
                }
              />
              Premium
            </label>
            <Button size="sm" onClick={() => void saveSchedule()}>
              Enregistrer
            </Button>
          </div>
        </section>
      )}

      {message && <p className="mt-4 text-sm text-emerald-600">{message}</p>}
    </div>
  );
}
