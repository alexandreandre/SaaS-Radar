import type { UserProject } from "@/lib/portfolio";
import {
  aggregateCampaigns,
  computeBurnRate,
  computeCac,
  computeLtv,
  computeRoas,
  computeRunwayMonths,
  getChurnRate,
  getDeltaPercent,
  getMetricsHistory,
  getSparklineValues,
  getTargetMrr,
} from "@/lib/portfolio";
import { getLatestSnapshot, getPreviousSnapshot } from "@/lib/connectors";
import { buildStackHealth } from "@/lib/stack-health";
import type { Opportunity } from "@/types/opportunity";

export type CockpitKpi = {
  key: string;
  label: string;
  value: string;
  raw: number;
  delta: number | null;
  sparkline: number[];
  format: "currency" | "number" | "percent" | "ratio" | "months";
};

export type CockpitMetrics = {
  latest: ReturnType<typeof getLatestSnapshot>;
  previous: ReturnType<typeof getPreviousSnapshot>;
  kpis: CockpitKpi[];
  arr: number;
  arpu: number;
  ltvCacRatio: number;
  roas: number;
  burnRate: number;
  runwayMonths: number | null;
  churnRate: number;
  campaignStats: ReturnType<typeof aggregateCampaigns>;
  hasDemoData: boolean;
  promiseProgressPct: number;
  stackCoveragePct: number;
  nrr: number;
  failedPayments: number;
};

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

function computeNrr(latest: NonNullable<ReturnType<typeof getLatestSnapshot>>): number {
  if (latest.mrr <= 0) return 100;
  const net = latest.newMrr + latest.expansionMrr - latest.churnedMrr;
  const startMrr = latest.mrr - net;
  if (startMrr <= 0) return 100;
  return Math.round((latest.mrr / startMrr) * 1000) / 10;
}

export function buildCockpitMetrics(
  project: UserProject,
  opportunity?: Opportunity
): CockpitMetrics {
  const history = getMetricsHistory(project);
  const latest = getLatestSnapshot(history) ?? {
    date: new Date().toISOString().slice(0, 7),
    mrr: project.currentMrr,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: project.currentMrr > 0 ? Math.max(1, Math.round(project.currentMrr / 79)) : 0,
    signups: 0,
    trials: 0,
    activeUsers: 0,
    mau: 0,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
  };
  const previous = getPreviousSnapshot(history);
  const campaigns = project.campaigns ?? [];
  const campaignStats = aggregateCampaigns(campaigns);
  const cac = computeCac(latest);
  const ltv = computeLtv(latest);
  const ltvCacRatio = cac > 0 ? Math.round((ltv / cac) * 10) / 10 : 0;
  const roas = computeRoas(campaigns);
  const burnRate = computeBurnRate(project);
  const runwayMonths = computeRunwayMonths(project);
  const churnRate = getChurnRate(latest, previous ?? undefined);
  const arr = latest.mrr * 12;
  const arpu = latest.customers > 0 ? Math.round(latest.mrr / latest.customers) : 0;
  const target = getTargetMrr(project);
  const promiseProgressPct =
    target > 0 ? Math.min(100, Math.round((latest.mrr / target) * 100)) : 0;

  const stackCoveragePct = opportunity
    ? buildStackHealth(opportunity, project.integrations).coveragePct
    : 0;

  const nrr = computeNrr(latest);
  const stripeStream = project.connectorStreams?.stripe;
  const failedPayments =
    stripeStream?.type === "payment" ? stripeStream.failedPayments : 0;

  const kpis: CockpitKpi[] = [
    {
      key: "mrr",
      label: "MRR",
      value: fmtCurrency(latest.mrr),
      raw: latest.mrr,
      delta: previous ? getDeltaPercent(latest.mrr, previous.mrr) : null,
      sparkline: getSparklineValues(history, "mrr").length
        ? getSparklineValues(history, "mrr")
        : [project.currentMrr],
      format: "currency",
    },
    {
      key: "arr",
      label: "ARR",
      value: fmtCurrency(arr),
      raw: arr,
      delta: previous ? getDeltaPercent(arr, previous.mrr * 12) : null,
      sparkline: getSparklineValues(history, "mrr").map((v) => v * 12),
      format: "currency",
    },
    {
      key: "customers",
      label: "Clients",
      value: String(latest.customers),
      raw: latest.customers,
      delta: previous ? getDeltaPercent(latest.customers, previous.customers) : null,
      sparkline: getSparklineValues(history, "customers"),
      format: "number",
    },
    {
      key: "mau",
      label: "MAU",
      value: String(latest.mau),
      raw: latest.mau,
      delta: previous ? getDeltaPercent(latest.mau, previous.mau) : null,
      sparkline: getSparklineValues(history, "mau"),
      format: "number",
    },
    {
      key: "cac",
      label: "CAC",
      value: fmtCurrency(cac),
      raw: cac,
      delta: previous ? getDeltaPercent(cac, computeCac(previous)) : null,
      sparkline: history.map((s) => computeCac(s)),
      format: "currency",
    },
    {
      key: "ltv",
      label: "LTV",
      value: fmtCurrency(ltv),
      raw: ltv,
      delta: previous ? getDeltaPercent(ltv, computeLtv(previous)) : null,
      sparkline: history.map((s) => computeLtv(s)),
      format: "currency",
    },
    {
      key: "ltvCac",
      label: "LTV / CAC",
      value: `${ltvCacRatio}x`,
      raw: ltvCacRatio,
      delta: null,
      sparkline: history.map((s) => {
        const c = computeCac(s);
        return c > 0 ? Math.round((computeLtv(s) / c) * 10) / 10 : 0;
      }),
      format: "ratio",
    },
    {
      key: "churn",
      label: "Churn",
      value: `${churnRate} %`,
      raw: churnRate,
      delta: previous
        ? getDeltaPercent(churnRate, getChurnRate(previous, history[history.length - 3]))
        : null,
      sparkline: history.map((s, i) => getChurnRate(s, history[i - 1])),
      format: "percent",
    },
    {
      key: "roas",
      label: "ROAS",
      value: `${roas}x`,
      raw: roas,
      delta: null,
      sparkline: [roas],
      format: "ratio",
    },
    {
      key: "runway",
      label: "Runway",
      value: runwayMonths !== null ? `${runwayMonths} mois` : "—",
      raw: runwayMonths ?? 0,
      delta: null,
      sparkline: runwayMonths !== null ? [runwayMonths] : [],
      format: "months",
    },
    {
      key: "target",
      label: "Objectif Radar",
      value: fmtCurrency(target),
      raw: target,
      delta: getDeltaPercent(latest.mrr, target),
      sparkline: [latest.mrr, target],
      format: "currency",
    },
  ];

  const hasDemoData = (project.integrations ?? []).some((i) => i.status === "demo");

  return {
    latest,
    previous,
    kpis,
    arr,
    arpu,
    ltvCacRatio,
    roas,
    burnRate,
    runwayMonths,
    churnRate,
    campaignStats,
    hasDemoData,
    promiseProgressPct,
    stackCoveragePct,
    nrr,
    failedPayments,
  };
}
