import "server-only";

import fs from "fs";
import path from "path";
import type { Json } from "@/types/database";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/the-build-road-email-template.html");

export function loadTemplate(): string {
  return fs.readFileSync(TEMPLATE_PATH, "utf-8");
}

/** Remplace toutes les occurrences de {{ KEY }} dans le template. */
export function renderTemplate(html: string, vars: Record<string, string>): string {
  let rendered = Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{ ${key} }}`, val),
    html
  );
  // SVG inline non supporté par les filtres anti-spam.
  rendered = rendered.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  // Google Fonts external CSS — déclenche certains filtres spam.
  rendered = rendered.replace(/<link[^>]+fonts\.googleapis\.com[^>]*>/gi, "");
  // Grand bloc de commentaire documentation en tête du template.
  rendered = rendered.replace(/<!--\s*={3,}[\s\S]*?={3,}\s*-->/g, "");
  // Namespaces VML/Office dans la balise <html> — non nécessaires, flaggés par certains filtres.
  rendered = rendered.replace(/ xmlns:v="[^"]*"/g, "").replace(/ xmlns:o="[^"]*"/g, "");
  return rendered;
}

export function formatFrenchDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

export function extractWhyText(raw: Json): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && !Array.isArray(first)) {
      const obj = first as Record<string, unknown>;
      if (typeof obj.fact === "string") {
        return obj.fact + (typeof obj.detail === "string" ? ` ${obj.detail}` : "");
      }
    }
  }
  return "";
}

export function extractPoints(raw: Json): [string, string] {
  const fallback: [string, string] = ["Opportunité validée par le radar.", "Place encore libre sur le marché français."];
  if (!raw || !Array.isArray(raw)) return fallback;

  const texts = (raw as unknown[]).slice(0, 2).map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>;
      if (typeof obj.fact === "string") {
        return obj.fact + (typeof obj.detail === "string" ? ` ${obj.detail}` : "");
      }
      if (typeof obj.label === "string" && typeof obj.value === "string") {
        return `${obj.label} : ${obj.value}`;
      }
    }
    return String(item);
  });

  return [
    texts[0] ?? fallback[0],
    texts[1] ?? fallback[1],
  ] as [string, string];
}

function fmtAmount(raw: number): string {
  if (raw >= 1_000_000) {
    return `${(raw / 1_000_000).toFixed(1).replace(".", ",")}M$`;
  }
  if (raw >= 1_000) {
    return `${(raw / 1_000).toFixed(1).replace(".", ",")}k$`;
  }
  return `${Math.round(raw)}$`;
}

// Les valeurs en base (revenue_min/max) sont en euros/dollars bruts.
// On calcule la moyenne et on formate avec k$ / M$ selon la magnitude.
export function formatMrr(min: number, max: number): string {
  const avg = max === 0 || min === max ? min : Math.round((min + max) / 2);
  return `${fmtAmount(avg)} MRR`;
}

export function sectorLabel(sector: string): string {
  const labels: Record<string, string> = {
    healthcare: "Santé",
    construction: "BTP",
    hr: "RH",
    finance: "Finance",
    legal: "Juridique",
    retail: "Commerce",
    education: "Éducation",
    hospitality: "Hôtellerie",
  };
  return labels[sector] ?? sector;
}
