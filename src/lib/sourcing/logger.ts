/**
 * Logs structurés du pipeline de sourcing + rapport de run agrégé.
 * Permet de consommer le run depuis le CLI (console) comme depuis une future API admin
 * (collecte du RunReport pour persistance en base — voir sourcing_runs).
 */

export type SourcingEvent =
  | { type: "start"; count: number; sector?: string; premium: boolean; country?: string }
  | { type: "models-ok"; models: string[] }
  | { type: "existing-loaded"; count: number }
  | { type: "round"; round: number; leads: number }
  | { type: "leads-selected"; count: number }
  | { type: "lead-skip"; name: string; reason: string }
  | {
      type: "traction-enriched";
      name: string;
      addedSignals: number;
      stillMissing: string[];
      countryMismatch: boolean;
    }
  | { type: "lead-ok"; name: string; slug: string; score: number }
  | { type: "score-gate-skip"; name: string; slug: string; score: number; min: number }
  | { type: "upsert-ok"; count: number }
  | { type: "warn"; message: string }
  | { type: "done"; written: number; requested: number; costLine: string };

export type LogFn = (event: SourcingEvent) => void;

export interface RunSkip {
  name: string;
  reason: string;
}

export interface RunReport {
  startedAt: string;
  finishedAt: string;
  requested: number;
  sector?: string;
  premium: boolean;
  discovered: number;
  structured: number;
  written: number;
  skipped: RunSkip[];
  costLine: string;
  status: "ok" | "partial" | "empty";
}

/** Logger console (CLI) avec emojis, équivalent aux logs historiques du script. */
export function consoleLogger(): LogFn {
  return (event) => {
    switch (event.type) {
      case "start":
        console.log(
          `🚀 Sourcing — count=${event.count}${event.country ? `, country=${event.country}` : ""}${event.sector ? `, sector=${event.sector}` : ""}${event.premium ? ", premium" : ""}`
        );
        break;
      case "models-ok":
        console.log(`✅ Modèles actifs : ${event.models.join(" + ")}`);
        break;
      case "existing-loaded":
        console.log(`📚 ${event.count} fiche(s) déjà en DB (exclues du sourcing)`);
        break;
      case "round":
        console.log(`🔎 round ${event.round} : ${event.leads} lead(s) bruts valides de Sonar`);
        break;
      case "leads-selected":
        console.log(`🧮 ${event.count} lead(s) retenu(s) après filtrage`);
        break;
      case "lead-skip":
        console.warn(`⏭️  skip "${event.name}" — ${event.reason}`);
        break;
      case "traction-enriched":
        console.log(
          `🔁 traction enrichie "${event.name}" — +${event.addedSignals} signal(s), manque: ${event.stillMissing.join(", ") || "aucun"}${event.countryMismatch ? ", pays encore incohérent" : ""}`
        );
        break;
      case "lead-ok":
        console.log(
          `🧠 structuré + ✅ validé "${event.name}" (slug: ${event.slug}, score: ${event.score})`
        );
        break;
      case "score-gate-skip":
        console.warn(
          `🚧 skip "${event.name}" (slug: ${event.slug}) — score ${event.score} < seuil ${event.min}`
        );
        break;
      case "upsert-ok":
        console.log(`✅ Sourcing terminé — ${event.count} fiche(s) écrite(s)`);
        break;
      case "warn":
        console.warn(`⚠️  ${event.message}`);
        break;
      case "done":
        console.log(event.costLine);
        break;
    }
  };
}

/** Combine plusieurs LogFn (ex. console + collecteur). */
export function combineLoggers(...loggers: LogFn[]): LogFn {
  return (event) => loggers.forEach((log) => log(event));
}
