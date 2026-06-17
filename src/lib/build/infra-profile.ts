import type { Opportunity } from "@/types/opportunity";
import type { BuildTool } from "@/lib/build/tools";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";

export type InfraService = "auth" | "database" | "payments" | "email" | "storage" | "ai";
export type InfraMode = "managed" | "recommended-stack" | "interface-native";
export type PrimaryBackend = "supabase" | "firebase" | null;

export type EnvVarSpec = {
  name: string;
  role: string;
  where: string;
};

export type InfraProfile = {
  services: InfraService[];
  mode: InfraMode;
  recommendedStack: string[];
  primaryBackend: PrimaryBackend;
  envVars: EnvVarSpec[];
  setupSteps: string[];
  promptBlockFr: string;
  promptBlockEn: string;
  uiSummaryFr: string;
  uiSummaryEn: string;
};

const INFRA_TASK_PATTERNS = [
  /\binitialisation\b/i,
  /\binit\b/i,
  /\bsetup repo\b/i,
  /\bsetup\b.*\b(next\.?js|supabase|tailwind|stripe|firebase)\b/i,
  /\b(next\.?js|supabase|tailwind|stripe|firebase)\b.*\bsetup\b/i,
  /\bmise en place\b.*\b(auth|authentification|bdd|base de données|database|schéma|schema)\b/i,
  /\b(auth|authentification)\b.*\b(mise en place|setup|configuration)\b/i,
  /\bschéma\b.*\b(bdd|base de données|database|supabase)\b/i,
  /\b(db schema|database schema|auth,? db)\b/i,
  /\bconfigure?\b.*\b(supabase|firebase|stripe|resend)\b/i,
  /\b(supabase|firebase)\b.*\b(projet|project|config)\b/i,
];

const AUTH_KEYWORDS =
  /\b(auth|authentification|inscription|connexion|login|signup|compte utilisateur|multi-?tenant|espace sécurisé|profil utilisateur)\b/i;
const DATABASE_KEYWORDS =
  /\b(sauvegarde|persistance|historique|profils?|stockage|base de données|database|bdd|crud|données utilisateur|multi-?user)\b/i;
const PAYMENTS_KEYWORDS = /\b(stripe|paiement|checkout|abonnement|billing|monétisation|subscription)\b/i;
const EMAIL_KEYWORDS = /\b(email|resend|notification|transactionnel)\b/i;
const STORAGE_KEYWORDS = /\b(upload|fichier|file storage|s3|bucket|document)\b/i;
const AI_KEYWORDS = /\b(openai|vision|ia |ai |gpt|llm|estimation photo)\b/i;

function stackIncludes(stack: string[], needle: string): boolean {
  const lower = needle.toLowerCase();
  return stack.some((item) => item.toLowerCase().includes(lower));
}

function collectFeatureText(opportunity: Opportunity): string {
  const parts = [
    ...opportunity.mvpPlan.features,
    opportunity.pitch,
    opportunity.claudePrompt ?? "",
    ...(opportunity.mvpPlan.launchChecklist ?? []),
  ];
  return parts.join("\n");
}

export function isInfraRoadmapTask(task: string): boolean {
  const trimmed = task.trim();
  if (!trimmed) return false;
  return INFRA_TASK_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function collectProductFeatures(opportunity: Opportunity): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const feature of opportunity.mvpPlan.features) {
    const key = feature.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(feature);
    }
  }

  for (const step of opportunity.mvpPlan.roadmap) {
    for (const task of step.tasks) {
      if (isInfraRoadmapTask(task)) continue;
      const key = task.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(task);
      }
    }
  }

  return merged;
}

export function inferInfraServices(opportunity: Opportunity): InfraService[] {
  const text = collectFeatureText(opportunity);
  const stack = opportunity.mvpPlan.stack;
  const services = new Set<InfraService>();

  if (AUTH_KEYWORDS.test(text) || stackIncludes(stack, "supabase") || stackIncludes(stack, "firebase")) {
    services.add("auth");
  }
  if (DATABASE_KEYWORDS.test(text) || stackIncludes(stack, "supabase") || stackIncludes(stack, "firebase")) {
    services.add("database");
  }
  if (PAYMENTS_KEYWORDS.test(text) || stackIncludes(stack, "stripe")) {
    services.add("payments");
  }
  if (EMAIL_KEYWORDS.test(text) || stackIncludes(stack, "resend")) {
    services.add("email");
  }
  if (STORAGE_KEYWORDS.test(text)) {
    services.add("storage");
  }
  if (AI_KEYWORDS.test(text) || stackIncludes(stack, "openai")) {
    services.add("ai");
  }

  if (services.size === 0) {
    services.add("auth");
    services.add("database");
  }

  return Array.from(services);
}

function resolvePrimaryBackend(stack: string[]): PrimaryBackend {
  if (stackIncludes(stack, "supabase")) return "supabase";
  if (stackIncludes(stack, "firebase")) return "firebase";
  return null;
}

function buildEnvVars(stack: string[]): EnvVarSpec[] {
  const vars: EnvVarSpec[] = [];

  if (stackIncludes(stack, "supabase")) {
    vars.push(
      {
        name: "SUPABASE_URL",
        role: "URL du projet Supabase",
        where: "supabase.com → Project Settings → API → Project URL",
      },
      {
        name: "SUPABASE_ANON_KEY",
        role: "Clé publique client (anon key)",
        where: "supabase.com → Project Settings → API → anon public",
      },
      {
        name: "SUPABASE_SERVICE_ROLE_KEY",
        role: "Clé serveur (webhooks, admin — jamais côté client)",
        where: "supabase.com → Project Settings → API → service_role",
      },
    );
  }

  if (stackIncludes(stack, "firebase")) {
    vars.push(
      {
        name: "NEXT_PUBLIC_FIREBASE_API_KEY",
        role: "Clé API Firebase",
        where: "Firebase Console → Project Settings → General",
      },
      {
        name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        role: "Domaine auth Firebase",
        where: "Firebase Console → Authentication → Settings",
      },
      {
        name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        role: "ID du projet Firebase",
        where: "Firebase Console → Project Settings",
      },
    );
  }

  if (stackIncludes(stack, "stripe")) {
    vars.push(
      {
        name: "STRIPE_SECRET_KEY",
        role: "Clé secrète Stripe (serveur)",
        where: "dashboard.stripe.com → Developers → API keys",
      },
      {
        name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        role: "Clé publique Stripe (client)",
        where: "dashboard.stripe.com → Developers → API keys",
      },
      {
        name: "STRIPE_WEBHOOK_SECRET",
        role: "Secret webhook Stripe",
        where: "dashboard.stripe.com → Developers → Webhooks",
      },
    );
  }

  if (stackIncludes(stack, "resend")) {
    vars.push({
      name: "RESEND_API_KEY",
      role: "Clé API emails transactionnels",
      where: "resend.com → API Keys",
    });
  }

  if (stackIncludes(stack, "openai")) {
    vars.push({
      name: "OPENAI_API_KEY",
      role: "Clé API OpenAI",
      where: "platform.openai.com → API keys",
    });
  }

  return vars;
}

function resolveInfraMode(tool: BuildTool): InfraMode {
  if (tool.level === "advanced") return "recommended-stack";
  if (tool.level === "intermediate") return "interface-native";
  return "managed";
}

function serviceLabelsFr(services: InfraService[]): string {
  const labels: Record<InfraService, string> = {
    auth: "authentification",
    database: "base de données",
    payments: "paiements",
    email: "emails",
    storage: "stockage fichiers",
    ai: "IA",
  };
  return services.map((s) => labels[s]).join(", ");
}

function serviceLabelsEn(services: InfraService[]): string {
  const labels: Record<InfraService, string> = {
    auth: "authentication",
    database: "database",
    payments: "payments",
    email: "email",
    storage: "file storage",
    ai: "AI",
  };
  return services.map((s) => labels[s]).join(", ");
}

function buildSetupSteps(tool: BuildTool, primaryBackend: PrimaryBackend, mode: InfraMode): string[] {
  if (mode === "managed") return [];

  if (tool.level === "advanced" && primaryBackend === "supabase") {
    return [
      "Créer un projet gratuit sur supabase.com",
      "Noter l'URL du projet et la clé anon (Settings → API)",
      "Activer l'auth email/password dans Authentication → Providers",
    ];
  }
  if (tool.level === "advanced" && primaryBackend === "firebase") {
    return [
      "Créer un projet sur console.firebase.google.com",
      "Activer Authentication (email/password) et Firestore",
    ];
  }
  if (tool.level === "nocode") {
    return [`Configurer auth et base de données via l'interface native de ${tool.name}`];
  }
  return [`Configurer auth et persistance via l'interface de ${tool.name}`];
}

function buildPromptBlock(
  tool: BuildTool,
  mode: InfraMode,
  stack: string[],
  services: InfraService[],
  envVars: EnvVarSpec[],
  language: BuildPromptLanguage,
): string {
  const stackLine = stack.join(", ");
  const envList = envVars.map((v) => v.name).join(", ");
  const servicesFr = serviceLabelsFr(services);
  const servicesEn = serviceLabelsEn(services);

  if (language === "en") {
    if (mode === "managed") {
      return `Infrastructure (${servicesEn}): ${tool.name} handles auth and data natively — no manual backend setup.`;
    }
    if (mode === "interface-native") {
      return `Infrastructure required (${servicesEn}): ${tool.name} handles most setup — explicitly configure auth and database in the tool interface. Required services: ${servicesEn}.`;
    }
    return `Mandatory architecture section: use recommended stack (${stackLine}). Services required: ${servicesEn}. Use Supabase for auth (email/password) + PostgreSQL with Row Level Security. Describe a minimal schema (tables, relations, RLS policies). Acceptable alternative: Firebase Auth + Firestore — only if justified. Forbidden: localStorage-only persistence, hardcoded mock data, TODOs left behind. Section 6 must list .env.example keys: ${envList || "all required API keys"}.`;
  }

  if (mode === "managed") {
    return `Infrastructure (${servicesFr}) : ${tool.name} gère auth et données nativement — pas de backend manuel.`;
  }
  if (mode === "interface-native") {
    return `Infrastructure requise (${servicesFr}) : ${tool.name} gère une partie du setup — configurer explicitement auth et base de données dans l'interface. Services : ${servicesFr}.`;
  }
  return `Section Architecture obligatoire : stack recommandée (${stackLine}). Services requis : ${servicesFr}. Utiliser Supabase pour l'auth (email/mot de passe) + PostgreSQL avec Row Level Security (RLS). Décrire un schéma minimal (tables, relations, politiques RLS). Alternative acceptable : Firebase Auth + Firestore — uniquement si justifié. Interdit : localStorage seul, données en dur, TODO laissés. Section 6 : lister les clés .env.example : ${envList || "toutes les clés API requises"}.`;
}

function buildUiSummary(
  tool: BuildTool,
  mode: InfraMode,
  services: InfraService[],
  primaryBackend: PrimaryBackend,
  stack: string[],
  language: BuildPromptLanguage,
): string {
  if (language === "en") {
    if (mode === "managed") {
      return `Auth & data via ${tool.name} (built-in)`;
    }

    const parts: string[] = [];

    if (primaryBackend === "supabase") {
      const supabaseServices = services.filter((s) =>
        ["auth", "database", "storage"].includes(s),
      );
      if (supabaseServices.length > 0) {
        parts.push(`${serviceLabelsEn(supabaseServices)} via Supabase (free tier)`);
      }
    } else if (primaryBackend === "firebase") {
      parts.push(`${serviceLabelsEn(services.filter((s) => ["auth", "database"].includes(s)))} via Firebase`);
    }

    if (services.includes("payments") && stackIncludes(stack, "stripe")) {
      parts.push("payments via Stripe");
    }
    if (services.includes("email") && stackIncludes(stack, "resend")) {
      parts.push("email via Resend");
    }
    if (services.includes("ai") && stackIncludes(stack, "openai")) {
      parts.push("AI via OpenAI");
    }

    if (parts.length > 0) return parts.join(" · ");
    return `${serviceLabelsEn(services)} → recommended stack`;
  }

  if (mode === "managed") {
    return `Auth & données via ${tool.name} (intégré)`;
  }

  const parts: string[] = [];

  if (primaryBackend === "supabase") {
    const supabaseServices = services.filter((s) =>
      ["auth", "database", "storage"].includes(s),
    );
    if (supabaseServices.length > 0) {
      parts.push(`${serviceLabelsFr(supabaseServices)} via Supabase (gratuit)`);
    }
  } else if (primaryBackend === "firebase") {
    parts.push(`${serviceLabelsFr(services.filter((s) => ["auth", "database"].includes(s)))} via Firebase`);
  }

  if (services.includes("payments") && stackIncludes(stack, "stripe")) {
    parts.push("paiements via Stripe");
  }
  if (services.includes("email") && stackIncludes(stack, "resend")) {
    parts.push("emails via Resend");
  }
  if (services.includes("ai") && stackIncludes(stack, "openai")) {
    parts.push("IA via OpenAI");
  }

  if (parts.length > 0) return parts.join(" · ");
  return `${serviceLabelsFr(services)} → stack recommandée`;
}

export function getInfraProfile(opportunity: Opportunity, tool: BuildTool): InfraProfile {
  const services = inferInfraServices(opportunity);
  const recommendedStack = opportunity.mvpPlan.stack;
  const primaryBackend = resolvePrimaryBackend(recommendedStack);
  const mode = resolveInfraMode(tool);
  const envVars = mode === "recommended-stack" ? buildEnvVars(recommendedStack) : [];
  const setupSteps = buildSetupSteps(tool, primaryBackend, mode);

  return {
    services,
    mode,
    recommendedStack,
    primaryBackend,
    envVars,
    setupSteps,
    promptBlockFr: buildPromptBlock(tool, mode, recommendedStack, services, envVars, "fr"),
    promptBlockEn: buildPromptBlock(tool, mode, recommendedStack, services, envVars, "en"),
    uiSummaryFr: buildUiSummary(tool, mode, services, primaryBackend, recommendedStack, "fr"),
    uiSummaryEn: buildUiSummary(tool, mode, services, primaryBackend, recommendedStack, "en"),
  };
}

export function getInfraUiSummary(profile: InfraProfile, language: BuildPromptLanguage): string {
  return language === "en" ? profile.uiSummaryEn : profile.uiSummaryFr;
}

export function getInfraPromptBlock(profile: InfraProfile, language: BuildPromptLanguage): string {
  return language === "en" ? profile.promptBlockEn : profile.promptBlockFr;
}

/** Callout infra UI — masqué quand l'outil gère auth/BDD nativement (Lovable, Base44…). */
export function shouldShowInfraCallout(profile: InfraProfile): boolean {
  return profile.mode !== "managed";
}
