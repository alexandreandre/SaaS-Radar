"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Loader2, Octagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SECTORS } from "@/lib/sourcing/constants";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";
import { sectorLabels } from "@/data/opportunities";
import {
  RULE_PRESETS,
  type AutoPublishRule,
  type SourcingSettings,
} from "@/lib/admin/publish-policy.shared";
import {
  getRunStatusMeta,
  isRunActive,
  isRunCancelling,
  isRunTrackableAsActive,
  runProgressLabel,
  runProgressPct,
  runWrittenDisplay,
} from "@/lib/admin/sourcing-run-status";
import {
  launchSourcingAction,
  processSourcingQueueAction,
  relaunchSourcingRunAction,
  resumeQueuedRunsAction,
  stopSourcingAction,
} from "@/lib/admin/sourcing-actions";
import { canEditAdmin } from "@/lib/admin/rbac";
import { useAdminRole } from "@/contexts/admin-role-context";
import type { AdminSourcingConsoleData } from "@/lib/admin/sourcing-page";
import { adminFetchJson } from "@/lib/admin/client-fetch";
import { CountryMultiSelect, type CountryOption } from "@/components/admin/country-multi-select";
import { cn } from "@/lib/utils";

type Run = {
  id: string;
  started_at: string;
  finished_at?: string | null;
  status: string;
  error?: string | null;
  count_requested: number;
  count_discovered?: number | null;
  count_structured?: number | null;
  count_written: number;
  sector: string | null;
  origin_country_code?: string | null;
  premium: boolean;
  cost_line: string | null;
  cost_usd: number | null;
  skipped: { name: string; reason: string }[];
  events: { type?: string; message?: string; name?: string; reason?: string }[];
  config?: Record<string, unknown> | null;
};

type Summary = {
  pendingDrafts: number;
  lastRun: {
    status?: string;
    started_at?: string;
    count_written?: number;
    origin_country_code?: string | null;
  } | null;
  queuedRunsCount?: number;
  monthCostUsd: number;
  publishedThisMonth?: number;
  monthlyCostCapUsd: number | null;
  costAlert: boolean;
  metrics30d: {
    runsTotal: number;
    runsEmpty: number;
    draftsWritten: number;
    costUsd: number;
    emptyRatePct: number;
  };
};

function parseApiError(json: { error?: string }, status?: number): string {
  if (status === 429 || json.error === "Rate limit exceeded") {
    return "Trop de requêtes — attendez 1 minute puis réessayez";
  }
  return json.error ?? "Erreur inconnue";
}

function formatRunCostShort(usd: number): string {
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(2)}`;
  if (usd > 0) return `$${usd.toFixed(4)}`;
  return "—";
}

function parseRunCost(run: Run): {
  total: number | null;
  sonar: number | null;
  gemini: number | null;
} {
  if (run.cost_usd != null && run.cost_usd > 0) {
    const sonar = run.cost_line?.match(/Sonar: \$([0-9.]+)/)?.[1];
    const gemini = run.cost_line?.match(/Gemini: \$([0-9.]+)/)?.[1];
    return {
      total: run.cost_usd,
      sonar: sonar != null ? Number.parseFloat(sonar) : null,
      gemini: gemini != null ? Number.parseFloat(gemini) : null,
    };
  }

  if (run.cost_line) {
    const total = run.cost_line.match(/(?:total du run: |run: )\$([0-9.]+)/i)?.[1]
      ?? run.cost_line.match(/\$([0-9.]+)/)?.[1];
    const sonar = run.cost_line.match(/Sonar: \$([0-9.]+)/)?.[1];
    const gemini = run.cost_line.match(/Gemini: \$([0-9.]+)/)?.[1];
    if (total != null) {
      return {
        total: Number.parseFloat(total),
        sonar: sonar != null ? Number.parseFloat(sonar) : null,
        gemini: gemini != null ? Number.parseFloat(gemini) : null,
      };
    }
  }

  return { total: null, sonar: null, gemini: null };
}

function RunCostCell({ run }: { run: Run }) {
  const { total, sonar, gemini } = parseRunCost(run);
  if (total == null || total <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const parts: string[] = [];
  if (sonar != null && sonar > 0) parts.push(`Sonar ${formatRunCostShort(sonar)}`);
  if (gemini != null && gemini > 0) parts.push(`Gemini ${formatRunCostShort(gemini)}`);
  const title = parts.length > 0 ? parts.join(" · ") : undefined;

  return (
    <span className="tabular-nums text-foreground" title={title}>
      {formatRunCostShort(total)}
    </span>
  );
}

function syncActiveRunsFromList(
  allRuns: Run[],
  setActiveRunIds: (ids: string[]) => void,
  setActiveRunsMap: (map: Record<string, Run>) => void
) {
  const active = allRuns.filter((r) => isRunTrackableAsActive(r));
  setActiveRunIds(active.map((r) => r.id));
  setActiveRunsMap(Object.fromEntries(active.map((r) => [r.id, r])));
}

function pruneCancellingRunIds(allRuns: Run[], cancellingIds: string[]): string[] {
  return cancellingIds.filter((id) => {
    const run = allRuns.find((r) => r.id === id);
    if (!run) return true;
    return isRunActive(run.status);
  });
}

/** Fusionne les runs actifs API avec les IDs lancés côté client (pas encore visibles en liste). */
function mergeActiveRuns(
  prevIds: string[],
  allRuns: Run[],
  activeFromApi: Run[],
  cancellingIds: string[]
): { ids: string[]; map: Record<string, Run> } {
  const cancelling = new Set(cancellingIds);
  const isTrackable = (run: Run) =>
    isRunTrackableAsActive(run) && !cancelling.has(run.id);

  const fromApi =
    activeFromApi.length > 0
      ? activeFromApi.filter(isTrackable)
      : allRuns.filter(isTrackable);
  const pendingLaunch = prevIds.filter(
    (id) => !allRuns.some((r) => r.id === id) && !cancelling.has(id)
  );
  const ids = Array.from(new Set([...pendingLaunch, ...fromApi.map((r) => r.id)]));

  const map: Record<string, Run> = {};
  for (const id of ids) {
    const fresh = allRuns.find((r) => r.id === id) ?? fromApi.find((r) => r.id === id);
    if (fresh) map[id] = fresh;
  }
  return { ids, map };
}

function RunStatusBadge({ status, error }: { status: string; error?: string | null }) {
  const meta = getRunStatusMeta(status, { error });
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", meta.className)}>
      {meta.label}
    </span>
  );
}

function FeedbackBanner({
  message,
  variant = "success",
}: {
  message: string | null;
  variant?: "success" | "error";
}) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "text-sm",
        variant === "success" ? "text-emerald-600" : "text-red-600"
      )}
    >
      {message}
    </p>
  );
}

type MarketOption = CountryOption;

export function SourcingConsole({
  initialData = null,
  initialError = null,
}: {
  initialData?: AdminSourcingConsoleData | null;
  initialError?: string | null;
} = {}) {
  const skipInitialLoad = useRef(initialData != null || initialError != null);
  const role = useAdminRole();
  const canEdit = canEditAdmin(role);
  const defaultMinScore = process.env.NEXT_PUBLIC_SOURCING_MIN_SCORE ?? "65";

  const [count, setCount] = useState(3);
  const [sector, setSector] = useState("");
  const [mode, setMode] = useState<"draft" | "direct">("draft");
  const [premium, setPremium] = useState(false);
  const [minScore, setMinScore] = useState("");
  const [markets, setMarkets] = useState<MarketOption[]>(() =>
    ((initialData?.markets as MarketOption[] | undefined) ?? []).map((m) => ({
      code: m.code,
      name: m.name,
      flag: m.flag,
    })),
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [runs, setRuns] = useState<Run[]>(() => (initialData?.runs as Run[] | undefined) ?? []);
  const [summary, setSummary] = useState<Summary | null>(
    () => (initialData?.summary as Summary | undefined) ?? null,
  );
  const [activeRunIds, setActiveRunIds] = useState<string[]>(() =>
    ((initialData?.activeRuns as Run[] | undefined) ?? []).map((r) => r.id),
  );
  const [activeRunsMap, setActiveRunsMap] = useState<Record<string, Run>>(() => {
    const map: Record<string, Run> = {};
    for (const run of (initialData?.activeRuns as Run[] | undefined) ?? []) {
      map[run.id] = run;
    }
    return map;
  });
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [initialLoading, setInitialLoading] = useState(!initialData && !initialError);
  const [loading, setLoading] = useState(false);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [relaunchingRunId, setRelaunchingRunId] = useState<string | null>(null);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [cancellingRunIds, setCancellingRunIds] = useState<string[]>([]);
  const resumedQueuedRef = useRef(false);
  const activeRunIdsRef = useRef<string[]>([]);
  const cancellingRunIdsRef = useRef<string[]>([]);

  const [launchFeedback, setLaunchFeedback] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [policyFeedback, setPolicyFeedback] = useState<string | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);

  const [policy, setPolicy] = useState<SourcingSettings | null>(
    () => initialData?.settings ?? null,
  );
  const [rules, setRules] = useState<AutoPublishRule[]>(
    () => initialData?.settings?.auto_publish_rules ?? [],
  );
  const [policyOpen, setPolicyOpen] = useState(false);
  const [simulation, setSimulation] = useState<{ total: number; wouldPublish: number } | null>(
    null
  );
  const [policySaving, setPolicySaving] = useState(false);

  const loadActiveRuns = useCallback(async () => {
    try {
      const [runsRes, summaryRes] = await Promise.all([
        adminFetchJson("/api/admin/sourcing"),
        adminFetchJson("/api/admin/sourcing/summary"),
      ]);
      const runsJson = runsRes.data as Record<string, unknown>;
      const summaryJson = summaryRes.data as Summary;

      if (runsRes.ok) {
        const allRuns = (runsJson.runs ?? []) as Run[];
        setRuns(allRuns);
        const activeFromApi = (runsJson.activeRuns ?? []) as Run[];
        const { ids, map } = mergeActiveRuns(
          activeRunIdsRef.current,
          allRuns,
          activeFromApi,
          cancellingRunIdsRef.current
        );
        activeRunIdsRef.current = ids;
        setActiveRunIds(ids);
        setActiveRunsMap(map);
        setCancellingRunIds((prev) => {
          const next = pruneCancellingRunIds(allRuns, prev);
          cancellingRunIdsRef.current = next;
          return next;
        });
      }
      if (summaryRes.ok) setSummary(summaryJson);
    } catch {
      // polling silencieux
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [runsRes, policyRes, marketsRes, summaryRes] = await Promise.all([
        adminFetchJson("/api/admin/sourcing"),
        adminFetchJson("/api/admin/sourcing/policy"),
        adminFetchJson("/api/admin/markets"),
        adminFetchJson("/api/admin/sourcing/summary"),
      ]);
      const runsJson = runsRes.data as Record<string, unknown>;
      const policyJson = policyRes.data as { settings?: SourcingSettings };
      const marketsJson = marketsRes.data as { markets?: MarketOption[] };
      const summaryJson = summaryRes.data as Summary;

      if (runsRes.ok) {
        const allRuns = (runsJson.runs ?? []) as Run[];
        setRuns(allRuns);
        const activeFromApi = (runsJson.activeRuns ?? []) as Run[];
        const { ids, map } = mergeActiveRuns(
          activeRunIdsRef.current,
          allRuns,
          activeFromApi,
          cancellingRunIdsRef.current
        );
        activeRunIdsRef.current = ids;
        setActiveRunIds(ids);
        setActiveRunsMap(map);
        setCancellingRunIds((prev) => {
          const next = pruneCancellingRunIds(allRuns, prev);
          cancellingRunIdsRef.current = next;
          return next;
        });
      }
      if (marketsRes.ok) {
        setMarkets(
          (marketsJson.markets ?? []).map((m: MarketOption) => ({
            code: m.code,
            name: m.name,
            flag: m.flag,
          }))
        );
      }
      if (policyRes.ok) {
        setPolicy(policyJson.settings ?? null);
        setRules(policyJson.settings?.auto_publish_rules ?? []);
      }
      if (summaryRes.ok) setSummary(summaryJson);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false;
      return;
    }
    void load();
  }, [load]);

  const hasActiveRuns = activeRunIds.length > 0;
  const hasCancellingRuns = cancellingRunIds.length > 0;
  const isSourcingBusy = hasActiveRuns || hasCancellingRuns;

  // Reprendre les runs en file au retour sur la page
  useEffect(() => {
    if (!canEdit || initialLoading || resumedQueuedRef.current || hasCancellingRuns) return;
    const queuedIds = runs
      .filter(
        (r) =>
          r.status === "queued" &&
          !isRunCancelling(r.config) &&
          !cancellingRunIdsRef.current.includes(r.id)
      )
      .map((r) => r.id);
    if (queuedIds.length === 0) return;
    resumedQueuedRef.current = true;
    void resumeQueuedRunsAction(queuedIds);
  }, [canEdit, initialLoading, runs, hasCancellingRuns]);

  useEffect(() => {
    activeRunIdsRef.current = activeRunIds;
  }, [activeRunIds]);

  useEffect(() => {
    cancellingRunIdsRef.current = cancellingRunIds;
  }, [cancellingRunIds]);

  useEffect(() => {
    if (!isSourcingBusy) return;
    void loadActiveRuns();
    const interval = setInterval(() => void loadActiveRuns(), 2000);
    return () => clearInterval(interval);
  }, [isSourcingBusy, loadActiveRuns]);

  useEffect(() => {
    if (activeRunIds.length === 0 || hasCancellingRuns) return;

    const trackedRuns = activeRunIds
      .map((id) => runs.find((r) => r.id === id))
      .filter(Boolean) as Run[];

    // Ne pas conclure tant que tous les runs lancés ne sont pas visibles en liste
    if (trackedRuns.length < activeRunIds.length) return;

    const stillActive = trackedRuns.some((r) => isRunActive(r.status));
    if (stillActive) return;

    const written = trackedRuns.reduce((s, r) => s + (r.count_written ?? 0), 0);
    setLaunchFeedback(`${written} fiche(s) publiée(s) dans le catalogue`);
    syncActiveRunsFromList(runs, setActiveRunIds, setActiveRunsMap);
    activeRunIdsRef.current = runs.filter((r) => isRunTrackableAsActive(r)).map((r) => r.id);
  }, [runs, activeRunIds, hasCancellingRuns]);

  useEffect(() => {
    if (cancellingRunIds.length === 0) return;

    const trackedRuns = cancellingRunIds
      .map((id) => runs.find((r) => r.id === id))
      .filter(Boolean) as Run[];

    if (trackedRuns.length < cancellingRunIds.length) return;

    const stillActive = trackedRuns.some((r) => isRunActive(r.status));
    if (stillActive) return;

    const written = trackedRuns.reduce((s, r) => s + (r.count_written ?? 0), 0);
    const cancelledCount = trackedRuns.length;
    setLaunchFeedback(
      `${cancelledCount} run(s) arrêté(s) — ${written} fiche(s) publiée(s) au total`
    );
    setCancellingRunIds([]);
    cancellingRunIdsRef.current = [];
  }, [runs, cancellingRunIds]);

  const activeRunsList = useMemo(
    () =>
      activeRunIds
        .map((id) => runs.find((r) => r.id === id) ?? activeRunsMap[id])
        .filter(Boolean) as Run[],
    [activeRunIds, activeRunsMap, runs]
  );

  const activeWrittenTotal = useMemo(
    () => activeRunsList.reduce((sum, run) => sum + (run.count_written ?? 0), 0),
    [activeRunsList]
  );

  const activeRequestedTotal = useMemo(
    () => activeRunsList.reduce((sum, run) => sum + (run.count_requested ?? 0), 0),
    [activeRunsList]
  );

  const policySummary = useMemo(() => {
    const activeRules = rules.filter((r) => r.enabled).length;
    const autoOn = policy?.auto_publish_enabled ? "ON" : "OFF";
    const cap =
      policy?.monthly_cost_cap_usd != null ? `${policy.monthly_cost_cap_usd} USD` : "illimité";
    return `Auto-publish : ${autoOn} · ${activeRules} règle(s) active(s) · Plafond ${cap}`;
  }, [policy, rules]);

  const launch = async () => {
    if (!canEdit) return;
    if (selectedCountries.length === 0) {
      setLaunchError("Sélectionnez au moins un pays");
      return;
    }
    setLoading(true);
    setLaunchError(null);
    setLaunchFeedback(null);
    try {
      const { runIds } = await launchSourcingAction({
        count,
        countries: selectedCountries,
        sector: sector || undefined,
        mode,
        premium,
        minScore: minScore.trim() ? Number.parseInt(minScore, 10) : undefined,
      });
      setActiveRunIds(runIds.filter(Boolean));
      activeRunIdsRef.current = runIds.filter(Boolean);
      setActiveRunsMap({});
      const modeLabel = mode === "draft" ? "Brouillon" : "Publication directe";
      setLaunchFeedback(
        `${modeLabel} lancé : ${selectedCountries.join(", ")} — jusqu'à ${selectedCountries.length * count} fiche(s)`
      );
      void load();
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const processQueue = useCallback(async () => {
    if (!canEdit) return;
    setQueueProcessing(true);
    setLaunchError(null);
    setLaunchFeedback(null);
    try {
      await processSourcingQueueAction({ maxJobs: 10 });
      setLaunchFeedback("Traitement lancé en arrière-plan…");
      void load();
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : String(err));
    } finally {
      setQueueProcessing(false);
    }
  }, [canEdit, load]);

  const cancellingRunsList = useMemo(
    () =>
      cancellingRunIds
        .map((id) => runs.find((r) => r.id === id))
        .filter(Boolean) as Run[],
    [cancellingRunIds, runs]
  );

  const confirmStop = async (keepWritten: boolean) => {
    if (!canEdit || activeRunIds.length === 0) return;
    const runIdsToStop = [...activeRunIds];

    setStopping(true);
    setLaunchError(null);
    setLaunchFeedback(null);
    setStopDialogOpen(false);
    setCancellingRunIds((prev) => {
      const next = Array.from(new Set([...prev, ...runIdsToStop]));
      cancellingRunIdsRef.current = next;
      return next;
    });
    setActiveRunIds([]);
    activeRunIdsRef.current = [];

    try {
      const { stopped, deletedOpportunities } = await stopSourcingAction({
        runIds: runIdsToStop,
        keepWritten,
      });
      if (stopped === 0) {
        throw new Error("Aucun run actif n'a pu être arrêté");
      }
      if (keepWritten) {
        setLaunchFeedback(
          `${stopped} run(s) en cours d'arrêt — les fiches déjà publiées seront conservées`
        );
      } else {
        setLaunchFeedback(
          deletedOpportunities > 0
            ? `${stopped} run(s) en cours d'arrêt — ${deletedOpportunities} fiche(s) seront supprimées`
            : `${stopped} run(s) en cours d'arrêt`
        );
      }
      void load();
    } catch (err) {
      setCancellingRunIds((prev) => {
        const next = prev.filter((id) => !runIdsToStop.includes(id));
        cancellingRunIdsRef.current = next;
        return next;
      });
      setActiveRunIds(runIdsToStop);
      activeRunIdsRef.current = runIdsToStop;
      setLaunchError(err instanceof Error ? err.message : String(err));
    } finally {
      setStopping(false);
    }
  };

  const relaunchRun = async (run: Run) => {
    if (!canEdit || isSourcingBusy) return;
    if (!run.origin_country_code) {
      setLaunchError("Relance impossible : pays d'origine manquant sur ce run");
      return;
    }
    setRelaunchingRunId(run.id);
    setLaunchError(null);
    setLaunchFeedback(null);
    try {
      const { runIds } = await relaunchSourcingRunAction(run.id);
      setActiveRunIds(runIds.filter(Boolean));
      activeRunIdsRef.current = runIds.filter(Boolean);
      setActiveRunsMap({});
      setLaunchFeedback(
        `Relance lancée — jusqu'à ${run.count_requested} fiche(s) dans le catalogue`
      );
      void load();
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : String(err));
    } finally {
      setRelaunchingRunId(null);
    }
  };

  const savePolicy = async () => {
    if (!canEdit) return;
    setPolicySaving(true);
    setPolicyError(null);
    try {
      const { ok, status, data: json } = await adminFetchJson<{
        settings?: SourcingSettings;
        error?: string;
      }>("/api/admin/sourcing/policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_publish_enabled: policy?.auto_publish_enabled ?? false,
          auto_publish_rules: rules,
          notify_on_pending: policy?.notify_on_pending ?? false,
          monthly_cost_cap_usd: policy?.monthly_cost_cap_usd ?? null,
        }),
      });
      if (!ok) throw new Error(parseApiError(json, status));
      setPolicy(json.settings ?? null);
      setRules(json.settings?.auto_publish_rules ?? []);
      setPolicyFeedback("Règles de publication enregistrées");
    } catch (err) {
      setPolicyError(err instanceof Error ? err.message : String(err));
    } finally {
      setPolicySaving(false);
    }
  };

  const simulatePolicy = async () => {
    setPolicyError(null);
    const { ok, data: json } = await adminFetchJson<{
      simulation?: { total: number; wouldPublish: number };
      error?: string;
    }>("/api/admin/sourcing/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "simulate",
        settings: { ...policy, auto_publish_rules: rules },
        runPremium: true,
      }),
    });
    if (!ok) {
      setPolicyError(parseApiError(json));
      return;
    }
    setSimulation(json.simulation ?? null);
  };

  const addPresetRule = (preset: AutoPublishRule) => {
    if (!canEdit) return;
    if (rules.some((r) => r.id === preset.id)) return;
    setRules((prev) => [...prev, { ...preset, id: `${preset.id}-${Date.now()}` }]);
  };

  const updateRuleCondition = (
    idx: number,
    patch: Partial<AutoPublishRule["conditions"]>
  ) => {
    if (!canEdit) return;
    setRules((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        conditions: { ...next[idx].conditions, ...patch },
      };
      return next;
    });
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Chargement du sourcing…</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <AdminPageHeader
        title="Sourcing v2"
        description="Pipeline IA — brouillon ou publication directe."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/system"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Cron & worker
              <ExternalLink className="size-3" />
            </Link>
            {canEdit && !isSourcingBusy && (summary?.queuedRunsCount ?? 0) > 0 && (
              <Button variant="outline" size="sm" disabled={queueProcessing} onClick={() => void processQueue()}>
                {queueProcessing ? "Traitement…" : "Traiter la file"}
              </Button>
            )}
            <Button variant="outline" onClick={() => void load()}>
              Rafraîchir
            </Button>
          </div>
        }
      />

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      {hasCancellingRuns && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin text-orange-600" />
            <p className="text-sm text-orange-900">
              {cancellingRunsList.length || cancellingRunIds.length} run(s) en cours d&apos;arrêt —
              interruption dès la prochaine étape du pipeline.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Actualiser
          </Button>
        </div>
      )}

      {hasActiveRuns && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin text-blue-600" />
            <p className="text-sm text-blue-900">
              {activeRunsList.length} run(s) en cours — le sourcing continue en arrière-plan si vous
              quittez cette page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                disabled={stopping}
                className="border-red-500/40 text-red-700 hover:bg-red-500/10"
                onClick={() => setStopDialogOpen(true)}
              >
                <Octagon className="mr-1.5 size-3.5" />
                {stopping ? "Arrêt…" : "Arrêter"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Actualiser
            </Button>
          </div>
        </div>
      )}

      <Dialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arrêter le sourcing en cours ?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1">
                <p>
                  {activeRunsList.length} run(s) seront interrompus ({activeWrittenTotal}/
                  {activeRequestedTotal} fiche(s) déjà publiée(s)).
                </p>
                <p>Les runs en file seront annulés immédiatement. Le run en cours s&apos;arrêtera
                  dès la prochaine étape.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" disabled={stopping} onClick={() => setStopDialogOpen(false)}>
              Continuer le sourcing
            </Button>
            <Button
              variant="outline"
              disabled={stopping}
              className="border-red-500/40 text-red-700 hover:bg-red-500/10"
              onClick={() => void confirmStop(false)}
            >
              Arrêter et supprimer
            </Button>
            <Button disabled={stopping} onClick={() => void confirmStop(true)}>
              Arrêter et garder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canEdit && !isSourcingBusy && (summary?.queuedRunsCount ?? 0) > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-900">
            {summary?.queuedRunsCount} run(s) en file — lancement du traitement…
          </p>
          <Button size="sm" disabled={queueProcessing} onClick={() => void processQueue()}>
            {queueProcessing ? "Démarrage…" : "Traiter la file"}
          </Button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Publiées ce mois"
          value={summary?.publishedThisMonth ?? "—"}
          hint="Fiches écrites dans le catalogue"
        />
        <KpiCard
          label="Coût du mois"
          value={
            summary
              ? summary.monthlyCostCapUsd != null
                ? `${summary.monthCostUsd.toFixed(2)} / ${summary.monthlyCostCapUsd} USD`
                : `${summary.monthCostUsd.toFixed(2)} USD`
              : "—"
          }
          hint={summary?.costAlert ? "Plafond dépassé" : "Budget OpenRouter"}
          className={summary?.costAlert ? "border-amber-500/40" : undefined}
        />
        <KpiCard
          label="Dernier run"
          value={
            summary?.lastRun?.status
              ? getRunStatusMeta(summary.lastRun.status).label
              : (summary?.queuedRunsCount ?? 0) > 0
                ? "En file"
                : "—"
          }
          hint={
            summary?.lastRun?.started_at
              ? `${new Date(summary.lastRun.started_at).toLocaleString("fr-FR")} · ${summary.lastRun.count_written ?? 0} écrit(s)${
                  (summary?.queuedRunsCount ?? 0) > 0
                    ? ` · ${summary?.queuedRunsCount} en cours`
                    : ""
                }`
              : (summary?.queuedRunsCount ?? 0) > 0
                ? `${summary?.queuedRunsCount} run(s) en attente de traitement`
                : undefined
          }
        />
        <KpiCard
          label="30 jours"
          value={summary ? `${summary.metrics30d.runsTotal} runs` : "—"}
          hint={
            summary
              ? `${summary.metrics30d.runsTotal} runs · ${summary.metrics30d.emptyRatePct}% vides · $${summary.metrics30d.costUsd.toFixed(2)}`
              : undefined
          }
        />
      </div>

      {/* Lancement */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-medium">Lancer un sourcing</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="text-xs uppercase text-muted-foreground">Fiches (par pays)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              disabled={!canEdit}
              onChange={(e) => setCount(Number.parseInt(e.target.value, 10) || 1)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Secteur</label>
            <select
              value={sector}
              disabled={!canEdit}
              onChange={(e) => setSector(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {sectorLabels[s] ?? s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Mode</label>
            <select
              value={mode}
              disabled={!canEdit}
              onChange={(e) => setMode(e.target.value === "direct" ? "direct" : "draft")}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="draft">Brouillon (relecture)</option>
              <option value="direct">Publication directe</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "draft"
                ? "Les fiches vont dans la file de brouillons pour validation."
                : "Publication immédiate dans le catalogue — vérifiez le score min."}
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-muted-foreground">Score min (pipeline)</label>
            <input
              value={minScore}
              disabled={!canEdit}
              onChange={(e) => setMinScore(e.target.value)}
              placeholder={`ex. ${defaultMinScore}`}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Vide = seuil serveur (SOURCING_MIN_SCORE).
            </p>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="text-xs uppercase text-muted-foreground">Premium</label>
            <div className="flex items-center gap-2">
              <Switch
                checked={premium}
                disabled={!canEdit}
                onCheckedChange={setPremium}
                aria-label="Activer le prompt Gemini enrichi"
              />
              <span className="text-sm text-muted-foreground">
                {premium ? "Prompt enrichi" : "Standard"}
              </span>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => void launch()}
              disabled={!canEdit || loading || isSourcingBusy}
              className="w-full sm:w-auto"
            >
              {loading || isSourcingBusy ? "En cours…" : "Lancer"}
            </Button>
          </div>
        </div>

        <CountryMultiSelect
          markets={markets}
          selected={selectedCountries}
          onChange={setSelectedCountries}
          max={5}
          min={0}
          label="Pays d'origine (1 run indépendant par pays, max 5)"
          hint={
            selectedCountries.length === 0
              ? "Aucun pays — sélectionnez au moins un pays pour lancer"
              : `${selectedCountries.length} pays — jusqu'à ${selectedCountries.length * count} fiche(s)`
          }
          disabled={!canEdit || loading || isSourcingBusy}
        />

        {(activeRunsList.length > 0 || cancellingRunsList.length > 0) && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {hasCancellingRuns && !hasActiveRuns ? "Runs en arrêt" : "Runs en cours"}
            </p>
            {[...activeRunsList, ...cancellingRunsList.filter((r) => !activeRunsList.some((a) => a.id === r.id))].map((run) => {
              const pct = runProgressPct(run);
              const cancelling = isRunCancelling(run.config) || cancellingRunIds.includes(run.id);
              const meta = cancelling
                ? { label: "Arrêt en cours", className: "bg-orange-500/10 text-orange-700" }
                : getRunStatusMeta(run.status, { error: run.error });
              const progressLabel = cancelling ? "Interruption en cours…" : runProgressLabel(run);
              return (
                <div key={run.id}>
                  <div className="mb-1 flex justify-between gap-2 text-xs">
                    <span>
                      {run.origin_country_code ?? "?"} — {meta.label}
                    </span>
                    <span className="shrink-0 text-right text-muted-foreground">{progressLabel}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        cancelling ? "bg-orange-500" : "bg-primary"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <FeedbackBanner message={launchFeedback} />
        <FeedbackBanner message={launchError} variant="error" />
      </section>

      {/* Runs récents */}
      <section>
        <h2 className="mb-3 text-lg font-medium">Runs récents</h2>
        <AdminTable headers={["Date", "Pays", "Statut", "Demandé", "Écrit", "Coût", ""]}>
          {runs.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                Aucun run récent.
              </td>
            </tr>
          ) : (
            runs.map((run) => (
            <Fragment key={run.id}>
              <tr className="border-t border-border">
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(run.started_at).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2 text-xs font-medium">
                  {run.origin_country_code ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <RunStatusBadge status={run.status} error={run.error} />
                </td>
                <td className="px-3 py-2 tabular-nums">{run.count_requested}</td>
                <td className="px-3 py-2 tabular-nums">
                  {runWrittenDisplay(run)}
                  {(run.count_written ?? 0) > (run.count_requested || 0) && (
                    <span className="ml-1 text-[10px] text-amber-600" title="Quota dépassé — sera corrigé au prochain rafraîchissement">
                      (+{(run.count_written ?? 0) - (run.count_requested || 0)})
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  <RunCostCell run={run} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        !canEdit ||
                        isSourcingBusy ||
                        relaunchingRunId === run.id ||
                        !run.origin_country_code
                      }
                      title={
                        !run.origin_country_code
                          ? "Pays d'origine manquant"
                          : isSourcingBusy
                            ? "Un run est déjà en cours"
                            : "Relancer avec les mêmes paramètres"
                      }
                      onClick={() => void relaunchRun(run)}
                    >
                      {relaunchingRunId === run.id ? "…" : "Relancer"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setSelectedRunId((id) => (id === run.id ? null : run.id))
                      }
                    >
                      {selectedRunId === run.id ? "Masquer" : "Détail"}
                    </Button>
                  </div>
                </td>
              </tr>
              {selectedRunId === run.id && (
                <tr className="border-t border-border bg-muted/20">
                  <td colSpan={7} className="px-4 py-4 text-sm">
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Découverts</p>
                        <p className="font-medium">{run.count_discovered ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Structurés</p>
                        <p className="font-medium">{run.count_structured ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Secteur</p>
                        <p className="font-medium">
                          {run.sector ? (sectorLabels[run.sector] ?? run.sector) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Durée</p>
                        <p className="font-medium">
                          {run.finished_at
                            ? `${Math.round(
                                (new Date(run.finished_at).getTime() -
                                  new Date(run.started_at).getTime()) /
                                  1000
                              )}s`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {run.skipped?.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer font-medium">
                          Skipped ({run.skipped.length})
                        </summary>
                        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                          {run.skipped.map((s, i) => (
                            <li key={i}>
                              <strong>{s.name}</strong> — {s.reason}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {run.events?.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer font-medium">
                          Events ({run.events.length}, 50 derniers affichés)
                        </summary>
                        <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto font-mono text-xs">
                          {run.events.slice(-50).map((ev, i) => (
                            <li key={i}>
                              {ev.type ?? "event"}
                              {ev.name ? ` · ${ev.name}` : ""}
                              {ev.reason ? ` · ${ev.reason}` : ""}
                              {ev.message ? ` · ${ev.message}` : ""}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
            ))
          )}
        </AdminTable>
      </section>

      {/* Policy accordéon */}
      <section className="rounded-lg border border-border bg-card">
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setPolicyOpen((v) => !v)}
        >
          <div>
            <h2 className="text-lg font-medium">Publication automatique (avancé)</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{policySummary}</p>
          </div>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              policyOpen && "rotate-180"
            )}
          />
        </button>

        {policyOpen && (
          <div className="border-t border-border px-5 pb-5 pt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Les fiches sont publiées directement dans le catalogue. Les règles ci-dessous ne
              s&apos;appliquent qu&apos;aux anciens brouillons encore en base.
            </p>

            {policy && (
              <div className="mb-4 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Mode par défaut : <strong className="text-foreground">{policy.default_mode}</strong>
                {policy.discovery_model && (
                  <>
                    {" "}
                    · Découverte :{" "}
                    <strong className="text-foreground">{policy.discovery_model}</strong>
                  </>
                )}
                {policy.structure_model && (
                  <>
                    {" "}
                    · Structure :{" "}
                    <strong className="text-foreground">{policy.structure_model}</strong>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={policy?.auto_publish_enabled ?? false}
                  onChange={(e) =>
                    setPolicy((p) => (p ? { ...p, auto_publish_enabled: e.target.checked } : p))
                  }
                />
                Auto-publication
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={policy?.notify_on_pending ?? false}
                  onChange={(e) =>
                    setPolicy((p) => (p ? { ...p, notify_on_pending: e.target.checked } : p))
                  }
                />
                Notifier si brouillons en attente
              </label>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Plafond coût/mois (USD)</span>
                <input
                  type="number"
                  disabled={!canEdit}
                  className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm"
                  value={policy?.monthly_cost_cap_usd ?? ""}
                  onChange={(e) =>
                    setPolicy((p) =>
                      p
                        ? {
                            ...p,
                            monthly_cost_cap_usd: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }
                        : p
                    )
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {RULE_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant="outline"
                  disabled={!canEdit}
                  onClick={() => addPresetRule(preset)}
                >
                  + {preset.label}
                </Button>
              ))}
            </div>

            {rules.length > 0 && (
              <ul className="mt-4 space-y-2">
                {rules.map((rule, idx) => (
                  <li
                    key={rule.id}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={rule.enabled}
                          onChange={(e) => {
                            const next = [...rules];
                            next[idx] = { ...rule, enabled: e.target.checked };
                            setRules(next);
                          }}
                          className="mr-2"
                        />
                        {rule.label}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!canEdit}
                        onClick={() => setRules((r) => r.filter((_, i) => i !== idx))}
                      >
                        Supprimer
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <label className="flex items-center gap-1">
                        Score ≥
                        <input
                          type="number"
                          disabled={!canEdit}
                          className="w-14 rounded border border-border bg-background px-1 py-0.5"
                          value={rule.conditions.minScore ?? ""}
                          onChange={(e) =>
                            updateRuleCondition(idx, {
                              minScore: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        Dedup max
                        <input
                          type="number"
                          disabled={!canEdit}
                          className="w-14 rounded border border-border bg-background px-1 py-0.5"
                          value={rule.conditions.maxDedupMatches ?? ""}
                          onChange={(e) =>
                            updateRuleCondition(idx, {
                              maxDedupMatches: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={rule.conditions.requireSourceVerified ?? false}
                          onChange={(e) =>
                            updateRuleCondition(idx, {
                              requireSourceVerified: e.target.checked || undefined,
                            })
                          }
                        />
                        URLs vérifiées
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void savePolicy()} disabled={!canEdit || policySaving}>
                Enregistrer les règles
              </Button>
              <Button variant="outline" disabled={!canEdit} onClick={() => void simulatePolicy()}>
                Simuler sur brouillons passés
              </Button>
            </div>
            <FeedbackBanner message={policyFeedback} />
            <FeedbackBanner message={policyError} variant="error" />
            {simulation && (
              <p className="mt-2 text-sm text-muted-foreground">
                Simulation : {simulation.wouldPublish}/{simulation.total} brouillons auraient été
                auto-publiés avec ces règles.
              </p>
            )}
          </div>
        )}
      </section>

      {!canEdit && (
        <p className="text-center text-xs text-muted-foreground">
          Mode lecture seule — actions de modification réservées aux éditeurs et propriétaires.
        </p>
      )}
    </div>
  );
}
