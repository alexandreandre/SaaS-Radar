import type { WorldMarket, TrendDirection, TopEarner } from "@/types/world-market";
import { getCountryNameFr, flagFromAlpha2 } from "@/lib/country-code";
import { opportunities } from "@/data/opportunities";

const TIER1 = new Set(["US", "GB", "DE", "CA", "AU", "IL", "NL", "SE", "SG", "FR", "CH", "IE", "BE", "AT"]);
const TIER2 = new Set([
  "ES", "IT", "PL", "JP", "KR", "MX", "BR", "IN", "NZ", "NO", "DK", "FI", "PT", "CZ", "RO", "HU", "GR",
  "CL", "CO", "AR", "ZA", "AE", "SA", "TW", "HK", "MY", "TH", "ID", "PH", "VN", "TR", "EG", "NG", "KE",
]);
const EU_FR_ADAPT = new Set([
  "FR", "BE", "CH", "LU", "MC", "GB", "DE", "NL", "ES", "IT", "PT", "AT", "IE", "SE", "DK", "FI", "NO",
  "PL", "CZ", "RO", "HU", "GR", "SK", "BG", "HR", "SI", "LT", "LV", "EE", "CY", "MT",
]);

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function tier(code: string): 1 | 2 | 3 | 4 {
  if (TIER1.has(code)) return 1;
  if (TIER2.has(code)) return 2;
  if (["RU", "CN", "UA", "PK", "BD", "IR", "IQ"].includes(code)) return 3;
  return 4;
}

function heatForTier(t: 1 | 2 | 3 | 4, seed: number): number {
  const ranges: Record<1 | 2 | 3 | 4, [number, number]> = {
    1: [78, 98],
    2: [52, 77],
    3: [35, 58],
    4: [18, 42],
  };
  const [min, max] = ranges[t];
  return min + (seed % (max - min + 1));
}

function trendForHeat(heat: number): TrendDirection {
  if (heat >= 80) return "rising";
  if (heat >= 55) return pick(["rising", "stable", "emerging"] as const, heat);
  if (heat >= 35) return pick(["emerging", "stable"] as const, heat);
  return pick(["stable", "cooling"] as const, heat);
}

const TREND_POOLS: Record<string, string[]> = {
  default: [
    "Vertical B2B niches en croissance",
    "Outils IA métier spécialisés",
    "Abonnements PME fragmentées",
  ],
  eu: [
    "Conformité RGPD & reporting",
    "SaaS métiers artisans et PME",
    "Export modèles UK/US vers EU",
  ],
  americas: [
    "Boring business à fort MRR",
    "Intégrations WhatsApp / SMS",
    "PLG + outbound hybride",
  ],
  asia: [
    "Mobile-first workflows",
    "Fintech & paiements PME",
    "Volume + expansion SEA",
  ],
  africa: [
    "Fintech leapfrog",
    "Agri-tech et logistique",
    "Mobile money adjacent SaaS",
  ],
};

function trendPool(code: string): string[] {
  if (EU_FR_ADAPT.has(code)) return TREND_POOLS.eu;
  if (["US", "CA", "MX", "BR", "AR", "CL", "CO"].includes(code)) return TREND_POOLS.americas;
  if (["JP", "KR", "CN", "IN", "SG", "ID", "TH", "VN", "MY", "PH"].includes(code)) return TREND_POOLS.asia;
  if (["NG", "KE", "ZA", "EG", "MA", "GH", "TZ"].includes(code)) return TREND_POOLS.africa;
  return TREND_POOLS.default;
}

const CATEGORIES = [
  "Gestion PME verticale",
  "Automatisation facturation",
  "CRM métier léger",
  "Conformité & audits",
  "Planification équipes terrain",
  "Portail client B2B",
  "Rappels & no-shows",
  "Devis & signatures",
];

const PREFIXES = ["Flow", "Stack", "Desk", "Pilot", "Hive", "Nest", "Bolt", "Grid", "Pulse", "Lane"];

function fakeSaasName(seed: number): string {
  return `${pick(PREFIXES, seed)}${pick(["ify", "Ops", "Hub", "Pro", "Desk"], seed + 1)}`;
}

function formatMrr(usd: number, code: string): string {
  if (usd >= 1000) {
    const sym =
      code === "GB" ? "£" : ["DE", "FR", "NL", "ES", "IT", "BE", "AT", "IE", "PT", "FI"].includes(code)
        ? "€"
        : "$";
    return `${sym}${Math.round(usd / 1000)}k`;
  }
  return `$${usd}`;
}

function franceAdaptable(code: string, heat: number): boolean {
  if (code === "FR") return false;
  if (EU_FR_ADAPT.has(code)) return true;
  if (["US", "CA", "GB", "AU", "NZ", "IL"].includes(code) && heat >= 60) return true;
  return heat >= 70 && ["SG", "CH", "NO", "SE", "DK"].includes(code);
}

export function generateMarket(code: string, override?: Partial<WorldMarket>): WorldMarket {
  const seed = hash(code);
  const t = tier(code);
  const heatScore = override?.heatScore ?? heatForTier(t, seed);
  const trackedMicroSaas =
    override?.trackedMicroSaas ??
    (t === 1 ? 200 + (seed % 2800) : t === 2 ? 80 + (seed % 600) : t === 3 ? 30 + (seed % 200) : 8 + (seed % 80));
  const newThisMonth = override?.newThisMonth ?? Math.max(1, Math.round(trackedMicroSaas * 0.04) + (seed % 12));
  const avgTopMrrUsd =
    override?.avgTopMrrUsd ??
    (t === 1 ? 25000 + (seed % 70000) : t === 2 ? 12000 + (seed % 35000) : 4000 + (seed % 18000));

  const pool = trendPool(code);
  const trends = override?.trends ?? [pick(pool, seed), pick(pool, seed + 1), pick(pool, seed + 2)];

  const earnerCount = t <= 2 ? 3 : t === 3 ? 2 : 1;
  const topEarners: TopEarner[] =
    override?.topEarners ??
    Array.from({ length: earnerCount }, (_, i) => {
      const mrr = Math.round(avgTopMrrUsd * (0.6 + (seed % 40) / 100) * (1 - i * 0.15));
      return {
        name: fakeSaasName(seed + i * 7),
        mrrUsd: mrr,
        mrrLabel: formatMrr(mrr, code),
        category: pick(CATEGORIES, seed + i),
        franceAdaptable: franceAdaptable(code, heatScore),
      };
    });

  const opportunitySlugs =
    override?.opportunitySlugs ??
    opportunities.filter((o) => o.originCountryCode === code).map((o) => o.slug);

  const name = override?.name ?? getCountryNameFr(code);
  const insight =
    override?.insight ??
    (heatScore >= 75
      ? `Marché prioritaire — ${trackedMicroSaas.toLocaleString("fr-FR")} SaaS suivis. Scannez les niches B2B >$20k MRR avant export vers votre marché cible.`
      : heatScore >= 50
        ? `Marché actif — signaux de traction réguliers. Bon candidat pour veille hebdomadaire et import sélectif.`
        : heatScore >= 30
          ? `Marché émergent — peu de références MRR élevées, mais angles locaux intéressants à surveiller.`
          : `Veille légère — densité SaaS faible. Prioriser uniquement si vous avez un réseau local fort.`);

  return {
    code,
    name,
    flag: flagFromAlpha2(code),
    heatScore,
    trackedMicroSaas,
    newThisMonth,
    avgTopMrrUsd,
    trend: override?.trend ?? trendForHeat(heatScore),
    trends,
    topEarners,
    opportunitySlugs,
    insight,
    scope:
      override?.scope ??
      (heatScore >= 75 ? "priority" : heatScore >= 50 ? "active" : heatScore >= 28 ? "emerging" : "watch"),
  };
}
