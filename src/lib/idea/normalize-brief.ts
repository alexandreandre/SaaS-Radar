import { SECTORS } from "@/lib/sourcing/constants";

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === "string" && value.trim()) {
    const parts = value
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [value.trim()];
  }
  return undefined;
}

function normalizeSubScore(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value <= 10) return value;
  if (value <= 100) return Math.round((value / 10) * 10) / 10;
  return 10;
}

function normalizeRoadmapDay(day: unknown): string | undefined {
  if (typeof day === "string" && day.trim()) return day.trim();
  if (typeof day === "number" && Number.isFinite(day)) return `J${day}`;
  return undefined;
}

function normalizeSector(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if ((SECTORS as readonly string[]).includes(normalized)) return normalized;

  const aliases: Record<string, (typeof SECTORS)[number]> = {
    sante: "healthcare",
    santé: "healthcare",
    health: "healthcare",
    btp: "construction",
    batiment: "construction",
    bâtiment: "construction",
    rh: "hr",
    "ressources humaines": "hr",
    finance: "finance",
    legal: "legal",
    juridique: "legal",
    retail: "retail",
    commerce: "retail",
    education: "education",
    éducation: "education",
    hospitality: "hospitality",
    hotellerie: "hospitality",
    hôtellerie: "hospitality",
  };

  return aliases[normalized] ?? value;
}

function normalizeFinancialName(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const key = value.trim().toLowerCase();
  if (key === "prudent") return "Prudent";
  if (key === "realiste" || key === "réaliste") return "Réaliste";
  if (key === "optimiste") return "Optimiste";
  return value;
}

/** Assouplit la sortie Gemini avant validation Zod stricte. */
export function normalizeIdeaBriefRaw(raw: unknown): unknown {
  const root = readRecord(raw);
  if (!root) return raw;

  const next: Record<string, unknown> = { ...root };

  const identity = readRecord(root.identity);
  if (identity) {
    next.identity = {
      ...identity,
      sector: normalizeSector(identity.sector),
      clientType:
        typeof identity.clientType === "string"
          ? identity.clientType.trim().toLowerCase()
          : identity.clientType,
    };
  }

  const mvpPlan = readRecord(root.mvpPlan);
  if (mvpPlan) {
    const stack = toStringArray(mvpPlan.stack);
    const features = toStringArray(mvpPlan.features);
    const notYet = toStringArray(mvpPlan.notYet);
    const roadmap = Array.isArray(mvpPlan.roadmap)
      ? mvpPlan.roadmap
          .slice(0, 6)
          .map((step) => {
            const record = readRecord(step);
            if (!record) return step;
            const day = normalizeRoadmapDay(record.day);
            const tasks = toStringArray(record.tasks);
            return {
              ...record,
              ...(day ? { day } : {}),
              ...(tasks ? { tasks } : {}),
            };
          })
      : mvpPlan.roadmap;

    next.mvpPlan = {
      ...mvpPlan,
      ...(stack ? { stack } : {}),
      ...(features ? { features } : {}),
      ...(notYet ? { notYet } : {}),
      ...(roadmap ? { roadmap } : {}),
    };
  }

  if (Array.isArray(root.financials)) {
    next.financials = root.financials.map((item) => {
      const record = readRecord(item);
      if (!record) return item;
      return { ...record, name: normalizeFinancialName(record.name) };
    });
  }

  const scores = readRecord(root.scores);
  if (scores) {
    next.scores = {
      ...scores,
      franceFit: normalizeSubScore(scores.franceFit) ?? scores.franceFit,
      buildability: normalizeSubScore(scores.buildability) ?? scores.buildability,
      margin: normalizeSubScore(scores.margin) ?? scores.margin,
      competitionGap: normalizeSubScore(scores.competitionGap) ?? scores.competitionGap,
    };
  }

  return next;
}
