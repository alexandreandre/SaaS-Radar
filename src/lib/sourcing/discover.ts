import { MODELS, SECTORS } from "./constants";
import { callOpenRouter, extractJsonObject, type CostTracker } from "./openrouter";
import { factualLeadSchema, formatZodError, type FactualLead } from "./schema";
import { formatExclusionBlock, type DynamicExclusions } from "./dynamic-exclusions";

const SONAR_SYSTEM = [
  "Tu es un analyste qui identifie de VRAIS MICRO-SaaS indie bootstrappés,",
  "pas des plateformes établies. Tu effectues une recherche web réelle et tu ne rapportes",
  "QUE des faits vérifiables. Tu réponds STRICTEMENT par un objet JSON, sans aucune prose.",
].join(" ");

interface DiscoverParams {
  count: number;
  sector?: string;
  originCountryCode: string;
  originCountryName: string;
  originFlag: string;
  exclusions: string[];
  dynamicExclusions?: DynamicExclusions;
  nicheHints?: string[];
  variation: boolean;
  tracker: CostTracker;
  model?: string;
}

function buildDiscoveryPrompt(params: DiscoverParams): string {
  const { count, sector, exclusions, variation, originCountryCode, originCountryName, originFlag } =
    params;
  const sectorLine = sector
    ? `Concentre-toi UNIQUEMENT sur le secteur "${sector}".`
    : `Classe chaque produit dans EXACTEMENT un de ces secteurs : ${SECTORS.join(", ")}.`;

  const countryLine = `Concentre-toi UNIQUEMENT sur des micro-SaaS opérant principalement sur le marché ${originCountryName} (${originCountryCode}). Chaque lead DOIT avoir originCountryCode="${originCountryCode}", originCountry="${originCountryName}", originFlag="${originFlag}".`;

  const exclusionLine =
    exclusions.length > 0
      ? `N'inclus AUCUN de ces produits (déjà connus) : ${exclusions.join("; ")}.`
      : "";

  const variationLine = variation
    ? `Propose des produits DIFFÉRENTS de tes suggestions précédentes (autres sous-niches dans ${originCountryName} uniquement).`
    : "";

  const dynamicBlock = params.dynamicExclusions
    ? formatExclusionBlock(params.dynamicExclusions)
    : "";

  const nicheLine =
    params.nicheHints && params.nicheHints.length > 0
      ? `Angles à explorer en priorité pour ce marché : ${params.nicheHints.join("; ")}.`
      : "";

  return [
    `Trouve ${count} MICRO-SaaS B2B/B2C réels, indie et bootstrappés, clonables en France par UN solo-founder.`,
    countryLine,
    sectorLine,
    `RÈGLE SECTEUR STRICTE : si un produit ne rentre dans AUCUN des secteurs autorisés (${SECTORS.join(", ")}), ÉCARTE-LE.`,
    exclusionLine,
    dynamicBlock,
    nicheLine,
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
    "- Chaque tractionSignal DOIT inclure kind : \"metric\" pour un chiffre (MRR, backlinks, avis) ou \"narrative\" pour une preuve textuelle (recommandation blog, témoignage cabinet).",
    "- Fournis au minimum 3 signaux dans cet ordre : 1) MRR/revenu, 2) autorité/SEO/recommandation, 3) communauté/avis/mentions.",
    `- foreignInspiration : le pays entre parenthèses DOIT être exactement "${originCountryName}" (même marché que originCountry).`,
    "- Si le MRR n'est pas sourçable publiquement : ajoute un signal narrative « MRR non public » plutôt que de laisser la catégorie vide.",
    "",
    "Réponds avec un UNIQUE objet JSON de cette forme exacte :",
    JSON.stringify(
      {
        leads: [
          {
            name: "Nom réel du produit",
            pitch: "Pitch court et concret",
            url: "https://exemple.com",
            originCountry: originCountryName,
            originCountryCode: originCountryCode,
            originFlag: originFlag,
            sector: "healthcare",
            targetClient: "Description du client cible",
            foreignInspiration: `Nom (${originCountryName}) — résumé d'une ligne`,
            tractionSignals: [
              {
                label: "MRR estimé",
                value: "$42k",
                source: "GetLatka",
                sourceUrl: "https://getlatka.com/...",
                kind: "metric",
              },
              {
                label: "Recommandation secteur",
                value: "Un cabinet comptable recommande l'outil pour les TPE.",
                source: "Blog cabinet comptable",
                sourceUrl: "https://exemple.com/article",
                kind: "narrative",
              },
              {
                label: "Mentions Reddit/IH",
                value: "47",
                source: "Reddit + Indie Hackers",
                sourceUrl: "https://www.indiehackers.com/...",
                kind: "metric",
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
  const model = params.model ?? MODELS.discovery;

  if (debug) {
    console.log(`\n[DEBUG discover] leads demandés à Sonar (count param)=${params.count}`);
    console.log(`[DEBUG discover] exclusions (${params.exclusions.length}): ${params.exclusions.slice(0, 5).join("; ")}${params.exclusions.length > 5 ? "…" : ""}`);
    console.log(`[DEBUG discover] variation=${params.variation} sector=${params.sector ?? "(all)"} country=${params.originCountryCode}`);
  }

  let lastZodErrors: string[] = [];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const retrySuffix =
      attempt > 1
        ? [
            "",
            "⚠️ RETRY — ta réponse précédente était invalide ou vide.",
            "Réponds UNIQUEMENT avec l'objet JSON, sans prose ni markdown.",
            lastZodErrors.length > 0
              ? `Erreurs fréquentes à corriger : ${lastZodErrors.slice(0, 3).join(" | ")}`
              : "",
          ]
            .filter(Boolean)
            .join("\n")
        : "";

    const userPrompt = buildDiscoveryPrompt(params) + retrySuffix;

    const { content, usage } = await callOpenRouter({
      model,
      system: SONAR_SYSTEM,
      user: userPrompt,
    });
    params.tracker.add("Sonar", usage);

    let json: unknown;
    try {
      json = extractJsonObject(content);
    } catch (err) {
      lastZodErrors = [
        err instanceof Error ? err.message : String(err),
        `contenu reçu: ${content.length} car.`,
      ];
      if (debug) {
        console.error(
          `[DEBUG discover] extractJsonObject THROW: ${err instanceof Error ? err.message : err}`
        );
      }
      if (attempt === 2) return [];
      continue;
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
    lastZodErrors = [];
    let rejected = 0;
    for (const raw of rawLeads) {
      const parsed = factualLeadSchema.safeParse(raw);
      if (parsed.success) {
        valid.push(parsed.data);
      } else {
        rejected++;
        lastZodErrors.push(formatZodError(parsed.error));
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

    if (valid.length > 0) return valid;
    if (attempt === 2) return valid;
  }

  return [];
}
