import type { Sector } from "@/types/opportunity";

export type SectorCatalogEntry = {
  id: string;
  label: string;
  group: string;
  /** Filtre les opportunités existantes (secteur stocké en base). */
  mapsTo?: Sector;
  keywords?: string[];
};

/** Secteurs affichés en puces rapides sur la landing. */
export const primarySectorIds = ["all", "healthcare", "construction", "finance", "legal"] as const;

export const primarySectorLabels: Record<(typeof primarySectorIds)[number], string> = {
  all: "Tous",
  healthcare: "Santé",
  construction: "BTP",
  finance: "Finance",
  legal: "Juridique",
};

/**
 * Catalogue étendu — recherche uniquement (jamais tout afficher d'un coup).
 * `mapsTo` relie une entrée fine au secteur des fiches existantes.
 */
export const sectorCatalog: SectorCatalogEntry[] = [
  { id: "hr", label: "RH & recrutement", group: "RH", mapsTo: "hr", keywords: ["paie", "talent", "drh"] },
  { id: "retail", label: "Commerce & services", group: "Commerce", mapsTo: "retail", keywords: ["retail", "boutique"] },
  { id: "education", label: "Éducation & formation", group: "Éducation", mapsTo: "education", keywords: ["edtech", "ecole", "lms"] },
  { id: "hospitality", label: "Restauration & hôtellerie", group: "Hôtellerie", mapsTo: "hospitality", keywords: ["resto", "hotel", "bar"] },
  { id: "health-dental", label: "Santé — cabinets dentaires", group: "Santé", mapsTo: "healthcare", keywords: ["dentiste", "orthodontie"] },
  { id: "health-physio", label: "Santé — kiné & rééducation", group: "Santé", mapsTo: "healthcare", keywords: ["physio", "osteo"] },
  { id: "health-vet", label: "Santé — vétérinaire", group: "Santé", mapsTo: "healthcare", keywords: ["clinique animale"] },
  { id: "health-aesthetic", label: "Santé — esthétique médicale", group: "Santé", mapsTo: "healthcare", keywords: ["medspa", "laser"] },
  { id: "health-home", label: "Santé — soins à domicile", group: "Santé", mapsTo: "healthcare", keywords: ["infirmier", "aide"] },
  { id: "health-pharma", label: "Santé — officines & pharma", group: "Santé", mapsTo: "healthcare", keywords: ["pharmacie"] },
  { id: "btp-crafts", label: "BTP — artisans du bâtiment", group: "BTP", mapsTo: "construction", keywords: ["plombier", "electricien", "macon"] },
  { id: "btp-renovation", label: "BTP — rénovation énergétique", group: "BTP", mapsTo: "construction", keywords: ["isolation", "pompe chaleur"] },
  { id: "btp-realestate", label: "Immobilier — agences & gestion", group: "BTP", mapsTo: "construction", keywords: ["syndic", "locatif"] },
  { id: "btp-architecture", label: "Architecture & BET", group: "BTP", mapsTo: "construction", keywords: ["plans", "permis"] },
  { id: "finance-accounting", label: "Comptabilité & cabinet EC", group: "Finance", mapsTo: "finance", keywords: ["expert comptable", "liasse"] },
  { id: "finance-fintech", label: "Fintech & paiements", group: "Finance", mapsTo: "finance", keywords: ["stripe", "encaissement"] },
  { id: "finance-insurance", label: "Assurance & courtage", group: "Finance", mapsTo: "finance", keywords: ["sinistre", "iard"] },
  { id: "finance-wealth", label: "Gestion de patrimoine", group: "Finance", mapsTo: "finance", keywords: ["cgp", "investissement"] },
  { id: "legal-lawfirm", label: "Cabinets d'avocats", group: "Juridique", mapsTo: "legal", keywords: ["dossier client", "honoraires"] },
  { id: "legal-compliance", label: "Conformité & RGPD", group: "Juridique", mapsTo: "legal", keywords: ["audit", "dpia"] },
  { id: "legal-notary", label: "Notariat", group: "Juridique", mapsTo: "legal", keywords: ["acte", "immobilier"] },
  { id: "logistics", label: "Logistique & transport", group: "Industrie", keywords: ["fleet", "entrepot", "livraison"] },
  { id: "manufacturing", label: "Industrie & production", group: "Industrie", keywords: ["usine", "qualite", "mes"] },
  { id: "automotive", label: "Automobile & mobilité", group: "Industrie", keywords: ["garage", "flotte", "ev"] },
  { id: "agri", label: "Agriculture & élevage", group: "Agro", keywords: ["exploitation", "cooperative"] },
  { id: "food-pro", label: "Agroalimentaire pro", group: "Agro", keywords: ["transformateur", "hygiene"] },
  { id: "energy", label: "Énergie & utilities", group: "Énergie", keywords: ["solaire", "reseau"] },
  { id: "environment", label: "Environnement & déchets", group: "Énergie", keywords: ["recyclage", "bilan carbone"] },
  { id: "marketing-agency", label: "Agences marketing", group: "Marketing", keywords: ["seo", "ads", "crm"] },
  { id: "media-creator", label: "Médias & créateurs", group: "Marketing", keywords: ["newsletter", "podcast"] },
  { id: "ecommerce", label: "E-commerce & D2C", group: "Commerce", keywords: ["shopify", "marketplace"] },
  { id: "beauty", label: "Beauté & coiffure", group: "Services", keywords: ["salon", "spa", "onglerie"] },
  { id: "fitness", label: "Sport & fitness", group: "Services", keywords: ["salle", "coach", "club"] },
  { id: "events", label: "Événementiel", group: "Services", keywords: ["wedding", "seminaire"] },
  { id: "travel", label: "Voyage & tourisme", group: "Hôtellerie", keywords: ["agence", "booking"] },
  { id: "cleaning", label: "Propreté & facility", group: "Services", keywords: ["nettoyage", "proprete"] },
  { id: "security", label: "Sécurité & gardiennage", group: "Services", keywords: ["videosurveillance", "alarme"] },
  { id: "it-msp", label: "IT — MSP & infogérance", group: "Tech", keywords: ["helpdesk", "serveur"] },
  { id: "saas-b2b", label: "SaaS B2B vertical", group: "Tech", keywords: ["saas", "niche"] },
  { id: "cyber", label: "Cybersécurité", group: "Tech", keywords: ["soc", "pentest"] },
  { id: "proptech", label: "PropTech", group: "Tech", keywords: ["locservice", "bail"] },
  { id: "insurtech", label: "InsurTech", group: "Tech", keywords: ["sinistre auto"] },
  { id: "public-admin", label: "Collectivités & public", group: "Public", keywords: ["mairie", "marche public"] },
  { id: "association", label: "Associations & ONG", group: "Public", keywords: ["adhesion", "don"] },
  { id: "childcare", label: "Petite enfance", group: "Éducation", keywords: ["creche", "petite creche"] },
  { id: "driving-school", label: "Auto-écoles", group: "Éducation", keywords: ["permis", "code"] },
  { id: "freelance", label: "Indépendants & freelances", group: "Services", keywords: ["facturation", "devis"] },
  { id: "franchise", label: "Franchises & réseaux", group: "Commerce", keywords: ["reseau", "redevance"] },
  { id: "import-export", label: "Import-export & douane", group: "Industrie", keywords: ["incoterm", "fret"] },
  { id: "wholesale", label: "Grossiste & distribution", group: "Commerce", keywords: ["b2b", "catalogue"] },
];

const primarySet = new Set<string>(primarySectorIds);
const pinnedChipIds = new Set<string>(["healthcare", "construction", "finance", "legal"]);

export function isPrimarySectorFilter(id: string): boolean {
  return primarySet.has(id);
}

export type SectorChip = { id: string; label: string };

const primaryOrder = ["healthcare", "construction", "finance", "legal"] as const;

/**
 * Puces secteur à afficher selon les opportunités présentes dans l'aperçu.
 * Primaires d'abord (ordre fixe), puis les autres secteurs du feed.
 */
export function getPresentSectorChips(sectors: Sector[]): SectorChip[] {
  const unique = Array.from(new Set(sectors));
  const chips: SectorChip[] = [];

  for (const id of primaryOrder) {
    if (unique.includes(id)) {
      chips.push({ id, label: primarySectorLabels[id] });
    }
  }

  for (const sector of unique) {
    if (primaryOrder.includes(sector as (typeof primaryOrder)[number])) continue;
    const label = sectorLabelsFromSector(sector);
    chips.push({ id: sector, label });
  }

  return chips;
}

function sectorLabelsFromSector(sector: Sector): string {
  const fromPrimary = primarySectorLabels[sector as keyof typeof primarySectorLabels];
  if (fromPrimary) return fromPrimary;
  const entry =
    sectorCatalog.find((e) => e.id === sector) ?? sectorCatalog.find((e) => e.mapsTo === sector);
  return entry?.label ?? sector;
}

export function getSectorCatalogEntry(id: string): SectorCatalogEntry | undefined {
  return sectorCatalog.find((e) => e.id === id);
}

export function getSectorFilterKey(id: string): string {
  if (id === "all") return "all";
  const entry = getSectorCatalogEntry(id);
  return entry?.mapsTo ?? id;
}

export function getSectorDisplayLabel(id: string): string {
  if (id === "all") return "Tous";
  if (id in primarySectorLabels) return primarySectorLabels[id as keyof typeof primarySectorLabels];
  return getSectorCatalogEntry(id)?.label ?? id;
}

function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const MAX_RESULTS = 10;
const MAX_SUGGESTIONS = 6;

/** Repères catalogue si peu de données sur un secteur secondaire. */
const featuredPickerIds = [
  "hr",
  "hospitality",
  "education",
  "retail",
  "health-dental",
  "logistics",
  "ecommerce",
  "it-msp",
  "marketing-agency",
] as const;

/** Secteurs mis en avant à l'ouverture du menu (hors puces principales). */
export function getTopSectorPickerSuggestions(
  presentSectors: Sector[] = [],
  limit = MAX_SUGGESTIONS
): SectorCatalogEntry[] {
  const seen = new Set<string>();
  const result: SectorCatalogEntry[] = [];

  const counts = new Map<Sector, number>();
  for (const sector of presentSectors) {
    if (pinnedChipIds.has(sector)) continue;
    counts.set(sector, (counts.get(sector) ?? 0) + 1);
  }

  const rankedSectors = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sector]) => sector);

  for (const sector of rankedSectors) {
    const entry =
      sectorCatalog.find((e) => e.id === sector) ??
      sectorCatalog.find((e) => e.mapsTo === sector);
    if (entry && !seen.has(entry.id)) {
      seen.add(entry.id);
      result.push(entry);
      if (result.length >= limit) return result;
    }
  }

  for (const id of featuredPickerIds) {
    if (result.length >= limit) break;
    const entry = getSectorCatalogEntry(id);
    if (entry && !seen.has(entry.id)) {
      seen.add(entry.id);
      result.push(entry);
    }
  }

  return result;
}

/** Entrées du catalogue hors puces principales, filtrées par recherche. */
export function searchSectorCatalog(query: string): SectorCatalogEntry[] {
  const q = normalizeSearch(query);
  if (!q) return [];

  const pool = sectorCatalog.filter((e) => !pinnedChipIds.has(e.id));

  const scored = pool
    .map((entry) => {
      const haystack = normalizeSearch(
        [entry.label, entry.group, ...(entry.keywords ?? [])].join(" ")
      );
      const labelNorm = normalizeSearch(entry.label);
      let score = 0;
      if (labelNorm.startsWith(q)) score += 3;
      else if (labelNorm.includes(q)) score += 2;
      if (haystack.includes(q)) score += 1;
      return { entry, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label, "fr"));

  return scored.slice(0, MAX_RESULTS).map((x) => x.entry);
}
