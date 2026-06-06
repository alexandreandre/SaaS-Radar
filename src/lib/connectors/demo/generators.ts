import type { MetricsSnapshot } from "@/lib/connectors/types";
import { createRng, lastNMonths } from "@/lib/connectors/demo/seeded-random";

function emptySnapshot(date: string, source: MetricsSnapshot["source"]): MetricsSnapshot {
  return {
    date,
    mrr: 0,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: 0,
    signups: 0,
    trials: 0,
    activeUsers: 0,
    mau: 0,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source,
  };
}

export function generateDemoSnapshots(
  seed: string,
  months: number,
  targetMrr: number,
  source: MetricsSnapshot["source"]
): MetricsSnapshot[] {
  const rng = createRng(seed);
  const dates = lastNMonths(months);
  const growthRate = targetMrr > 0 ? Math.pow(targetMrr / Math.max(500, targetMrr * 0.15), 1 / months) : 1.08;

  let mrr = Math.max(0, Math.round(targetMrr * 0.08));
  let customers = Math.max(1, Math.round(mrr / 79));

  return dates.map((date, index) => {
    const seasonality = 1 + Math.sin((index / months) * Math.PI * 2) * 0.08;
    const noise = 0.92 + rng() * 0.16;
    mrr = Math.round(mrr * growthRate * seasonality * noise);
    if (targetMrr > 0) mrr = Math.min(mrr, Math.round(targetMrr * 1.15));

    const newMrr = Math.round(mrr * (0.12 + rng() * 0.08));
    const churnedMrr = Math.round(mrr * (0.03 + rng() * 0.04));
    const expansionMrr = Math.round(mrr * (0.02 + rng() * 0.03));
    customers = Math.max(1, Math.round(mrr / (65 + rng() * 30)));

    const signups = Math.round(customers * (0.15 + rng() * 0.2));
    const trials = Math.round(signups * (0.4 + rng() * 0.2));
    const activeUsers = Math.round(customers * (2.5 + rng() * 1.5));
    const mau = Math.round(activeUsers * (1.2 + rng() * 0.3));
    const dau = Math.round(mau * (0.18 + rng() * 0.12));

    const adSpend = Math.round(200 + rng() * 800 + index * 40);
    const impressions = Math.round(adSpend * (80 + rng() * 120));
    const clicks = Math.round(impressions * (0.008 + rng() * 0.012));
    const conversions = Math.max(1, Math.round(clicks * (0.02 + rng() * 0.04)));

    return {
      date,
      mrr,
      newMrr,
      expansionMrr,
      churnedMrr,
      customers,
      arr: mrr * 12,
      signups,
      trials,
      activeUsers,
      mau,
      dau,
      adSpend,
      impressions,
      clicks,
      conversions,
      source,
    };
  });
}

export function generatePartialSnapshots(
  seed: string,
  months: number,
  targetMrr: number,
  source: MetricsSnapshot["source"],
  fields: (keyof MetricsSnapshot)[]
): MetricsSnapshot[] {
  const full = generateDemoSnapshots(seed, months, targetMrr, source);
  return full.map((snap) => {
    const base = emptySnapshot(snap.date, source);
    for (const field of fields) {
      if (field in snap && field !== "source" && field !== "date") {
        (base as Record<string, unknown>)[field] = snap[field as keyof MetricsSnapshot];
      }
    }
    if (fields.includes("mrr")) {
      base.arr = snap.mrr * 12;
    }
    return base;
  });
}
