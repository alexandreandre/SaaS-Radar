import { MODELS, SECTORS } from "./constants";
import { callOpenRouter, extractJsonObject, type CostTracker } from "./openrouter";
import { factualLeadSchema, formatZodError, type FactualLead } from "./schema";

const SONAR_SYSTEM = [
  "Tu es un analyste qui identifie de VRAIS MICRO-SaaS indie (anglophones, surtout US),",
  "pas des plateformes établies. Tu effectues une recherche web réelle et tu ne rapportes",
  "QUE des faits vérifiables. Tu réponds STRICTEMENT par un objet JSON, sans aucune prose.",
].join(" ");

interface DiscoverParams {
  count: number;
  sector?: string;
  exclusions: string[];
  variation: boolean;
  tracker: CostTracker;
}

function buildDiscoveryPrompt(params: DiscoverParams): string {
  const { count, sector, exclusions, variation } = params;
  const sectorLine = sector
    ? `Concentre-toi UNIQUEMENT sur le secteur "${sector}".`
    : `Classe chaque produit dans EXACTEMENT un de ces secteurs : ${SECTORS.join(", ")}.`;

  const exclusionLine =
    exclusions.length > 0
      ? `N'inclus AUCUN de ces produits (déjà connus) : ${exclusions.join("; ")}.`
      : "";

  const variationLine = variation
    ? "Propose des produits DIFFÉRENTS de tes suggestions précédentes (autres sous-niches, autres pays anglophones)."
    : "";

  return [
    `Trouve ${count} MICRO-SaaS B2B/B2C réels, indie et bootstrappés, clonables en France par UN solo-founder.`,
    sectorLine,
    `RÈGLE SECTEUR STRICTE : si un produit ne rentre dans AUCUN des secteurs autorisés (${SECTORS.join(", ")}), ÉCARTE-LE.`,
    exclusionLine,
    variationLine,
    "",
    "PROFIL MICRO-SaaS OBLIGATOIRE (critique — ne ramène PAS de plateformes) :",
    "- UNE fonction bien faite, périmètre étroit — PAS une suite complète (pas d'EHR, pas de ERP, pas de « tout-en-un »).",
    "- Buildable par UN développeur seul en ~30 jours pour un MVP France.",
    "- Idéalement < $50k MRR, lancé par un solo-founder ou équipe de 1-3 personnes max.",
    "- Sources typiques : Indie Hackers, micro-SaaS bootstrappés, produits niche sur Product Hunt / GetLatka petits.",
    "",
    "EXCLURE EXPLICITEMENT (ne pas proposer, même si rentables) :",
    "- Plateformes matures, scale-ups financées, produits avec 50k+ utilisateurs ou clients.",
    "- Suites complètes : EHR, practice management all-in-one, CRM enterprise, logiciels de gestion de cabinet complets.",
    "- Tout produit ayant levé des fonds significatifs ou employant une grande équipe.",
    "- Exemples à ÉVITER : SimplePractice, DrChrono, TheraPlatform, Doctolib-like, Salesforce-like.",
    "",
    "EXEMPLES DU BON PROFIL (cible ce type de produit) :",
    "- Rappels SMS automatiques pour une niche métier (kinés, vétos, artisans).",
    "- Calculateur / estimateur métier pour un seul type de professionnel.",
    "- Outil de devis ou facturation pour UN type d'artisan, mobile-first.",
    "- Réceptionniste IA pour UNE spécialité (ex: cabinets dentaires), pas un EHR.",
    "- PAS : « logiciel de gestion de cabinet complet », « plateforme de télésanté tout-en-un ».",
    "",
    "CONSERVATISME SUR LA TRACTION (critique) :",
    "- Ne rapporte que des chiffres que tu peux réellement sourcer.",
    "- Si tu n'es pas sûr d'un chiffre, ne l'invente pas — OMETS-LE.",
    "- Préfère MOINS de signaux réels à PLUS de signaux incertains.",
    "- Chaque tractionSignal DOIT avoir une sourceUrl réelle et vérifiable (URL complète).",
    "",
    "Réponds avec un UNIQUE objet JSON de cette forme exacte :",
    JSON.stringify(
      {
        leads: [
          {
            name: "Nom réel du produit",
            pitch: "Pitch court et concret",
            url: "https://exemple.com",
            originCountry: "États-Unis",
            originCountryCode: "US",
            originFlag: "🇺🇸",
            sector: "healthcare",
            targetClient: "Description du client cible",
            foreignInspiration: "Nom (pays) — résumé d'une ligne",
            tractionSignals: [
              {
                label: "MRR estimé",
                value: "$42k",
                source: "GetLatka",
                sourceUrl: "https://getlatka.com/...",
              },
            ],
          },
        ],
      },
      null,
      0
    ),
    "",
    "Aucune prose, aucun commentaire : uniquement l'objet JSON.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Étape A — appelle Sonar et renvoie les leads dont la FORME est valide (Zod). */
export async function discoverLeads(params: DiscoverParams): Promise<FactualLead[]> {
  const debug = process.env.SOURCING_DEBUG === "1";

  if (debug) {
    console.log(`\n[DEBUG discover] leads demandés à Sonar (count param)=${params.count}`);
    console.log(`[DEBUG discover] exclusions (${params.exclusions.length}): ${params.exclusions.slice(0, 5).join("; ")}${params.exclusions.length > 5 ? "…" : ""}`);
    console.log(`[DEBUG discover] variation=${params.variation} sector=${params.sector ?? "(all)"}`);
  }

  const { content, usage } = await callOpenRouter({
    model: MODELS.discovery,
    system: SONAR_SYSTEM,
    user: buildDiscoveryPrompt(params),
  });
  params.tracker.add("Sonar", usage);

  let json: unknown;
  try {
    json = extractJsonObject(content);
  } catch (err) {
    if (debug) {
      console.error(
        `[DEBUG discover] extractJsonObject THROW: ${err instanceof Error ? err.message : err}`
      );
    }
    throw err;
  }

  if (debug) {
    const topKeys =
      json && typeof json === "object" && !Array.isArray(json)
        ? Object.keys(json as Record<string, unknown>).join(", ")
        : "(array or primitive)";
    console.log(`[DEBUG discover] JSON extrait — type=${Array.isArray(json) ? "array" : typeof json} keys=${topKeys}`);
  }

  const rawLeads: unknown[] = Array.isArray(json)
    ? json
    : Array.isArray((json as { leads?: unknown[] })?.leads)
      ? ((json as { leads: unknown[] }).leads)
      : [];

  if (debug) {
    console.log(`[DEBUG discover] rawLeads extraits=${rawLeads.length}`);
  }

  const valid: FactualLead[] = [];
  let rejected = 0;
  for (const raw of rawLeads) {
    const parsed = factualLeadSchema.safeParse(raw);
    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      rejected++;
      if (debug && rejected <= 3) {
        const name =
          raw && typeof raw === "object" && "name" in raw
            ? String((raw as { name: unknown }).name)
            : "(sans nom)";
        console.log(`[DEBUG discover] Zod REJECT #${rejected} "${name}": ${formatZodError(parsed.error)}`);
      }
    }
  }

  if (debug) {
    console.log(`[DEBUG discover] Zod OK=${valid.length} REJECT=${rejected}\n`);
  }

  return valid;
}
