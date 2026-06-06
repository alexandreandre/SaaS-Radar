import { getCountryNameFr, flagFromAlpha2 } from "@/lib/country-code";

const WESTERN_EU = new Set([
  "FR", "DE", "GB", "NL", "BE", "ES", "IT", "PT", "AT", "IE", "SE", "DK", "FI", "NO", "CH", "LU",
  "PL", "CZ", "RO", "HU", "GR", "SK", "BG", "HR", "SI", "LT", "LV", "EE", "CY", "MT",
]);

const ANGLOSPHERE = new Set(["US", "CA", "GB", "AU", "NZ", "IE"]);
const LATAM = new Set(["BR", "MX", "AR", "CL", "CO", "PE", "UY"]);
const ASIA_PACIFIC = new Set(["JP", "KR", "SG", "IN", "ID", "TH", "VN", "MY", "PH", "HK", "TW", "AU", "NZ"]);

export interface TargetFit {
  score: number;
  adaptable: boolean;
  label: "excellent" | "good" | "moderate" | "low" | "home";
}

function hashPair(a: string, b: string): number {
  const s = a < b ? `${a}-${b}` : `${b}-${a}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

/** Score d'adaptation d'un SaaS né dans `origin` vers le marché cible `target` */
export function getTargetFit(originCode: string, targetCode: string): TargetFit {
  const origin = originCode.toUpperCase();
  const target = targetCode.toUpperCase();

  if (origin === target) {
    return { score: 100, adaptable: true, label: "home" };
  }

  let score = 35 + (hashPair(origin, target) % 25);

  if (ANGLOSPHERE.has(origin) && WESTERN_EU.has(target)) score = 72 + (hashPair(origin, target) % 18);
  else if (WESTERN_EU.has(origin) && WESTERN_EU.has(target)) score = 78 + (hashPair(origin, target) % 17);
  else if (ANGLOSPHERE.has(origin) && ANGLOSPHERE.has(target)) score = 68 + (hashPair(origin, target) % 20);
  else if (ANGLOSPHERE.has(origin) && LATAM.has(target)) score = 55 + (hashPair(origin, target) % 20);
  else if (LATAM.has(origin) && LATAM.has(target)) score = 62 + (hashPair(origin, target) % 22);
  else if (ANGLOSPHERE.has(origin) && ASIA_PACIFIC.has(target)) score = 48 + (hashPair(origin, target) % 18);
  else if (WESTERN_EU.has(origin) && ANGLOSPHERE.has(target)) score = 58 + (hashPair(origin, target) % 22);
  else if (origin === "IL" && (WESTERN_EU.has(target) || ANGLOSPHERE.has(target))) score = 70 + (hashPair(origin, target) % 15);

  score = Math.min(98, Math.max(12, score));

  const adaptable = score >= 55;
  const label: TargetFit["label"] =
    score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 45 ? "moderate" : "low";

  return { score, adaptable, label };
}

export function isAdaptableToTarget(originCode: string, targetCode: string): boolean {
  return getTargetFit(originCode, targetCode).adaptable;
}

export function getTargetFitLabel(fit: TargetFit): string {
  switch (fit.label) {
    case "home":
      return "Marché domestique";
    case "excellent":
      return "Excellent potentiel";
    case "good":
      return "Bon potentiel";
    case "moderate":
      return "Potentiel modéré";
    case "low":
      return "Faible transfert";
  }
}

export function formatTargetMarket(code: string): { code: string; name: string; flag: string } {
  return {
    code: code.toUpperCase(),
    name: getCountryNameFr(code),
    flag: flagFromAlpha2(code),
  };
}

/** Verdict actionnable pour un pays d'origine vs marché cible */
export function getTargetVerdict(
  originName: string,
  originCode: string,
  targetCode: string,
  targetName: string,
  heatScore: number,
  adaptableCount: number,
  dbCount: number
): string {
  const fit = getTargetFit(originCode, targetCode);

  if (fit.label === "home") {
    return `Marché domestique — vous construisez directement pour ${targetName}. Priorisez la différenciation locale et les canaux du pays.`;
  }

  if (dbCount > 0) {
    return `${dbCount} playbook${dbCount > 1 ? "s" : ""} indexé${dbCount > 1 ? "s" : ""} depuis ${originName} avec analyse d'import vers ${targetName}. Commencez par le meilleur score.`;
  }

  if (fit.score >= 80 && adaptableCount > 0) {
    return `Fort signal d'import ${originName} → ${targetName} : ${adaptableCount} SaaS repérés avec traction. Validez la niche avant de coder.`;
  }

  if (fit.score >= 65) {
    return `Bon candidat pour un clone ${originName} → ${targetName}. Le modèle est prouvé à l'étranger — vérifiez concurrence et pricing local.`;
  }

  if (fit.score >= 45) {
    return `Transfert possible mais exigeant. Étudiez les top revenus ${originName} et adaptez fortement au contexte ${targetName}.`;
  }

  if (heatScore >= 70) {
    return `${originName} est un marché SaaS chaud, mais le transfert vers ${targetName} reste incertain — niche et go-to-market locaux cruciaux.`;
  }

  return `Peu recommandé pour importer vers ${targetName} depuis ${originName}. Mieux vaut chercher d'autres origines avec un meilleur fit.`;
}

export function getRecommendedAction(
  targetCode: string,
  targetName: string,
  originCode: string,
  dbCount: number,
  fit: TargetFit
): string {
  if (fit.label === "home") return `Lancer sur ${targetName}`;
  if (dbCount > 0) return `Voir le playbook ${targetName}`;
  if (fit.score >= 70) return `Étudier le clone ${targetName}`;
  return `Comparer d'autres origines`;
}
