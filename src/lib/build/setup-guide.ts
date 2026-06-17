import type { BuildTool } from "@/lib/build/tools";
import type { InfraProfile } from "@/lib/build/infra-profile";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import { collectProductFeatures } from "@/lib/build/infra-profile";
import type { Opportunity } from "@/types/opportunity";
import type { SetupStepKind } from "@/lib/build/kit-content";

export type SetupGuideStep = {
  kind: SetupStepKind;
  title: string;
  body: string;
  recommended?: boolean;
};

const TOOLS_WITH_PLAN_MODE = new Set([
  "cursor",
  "claude-code",
  "windsurf",
  "replit",
  "bolt",
]);

function envKeyNames(infraProfile: InfraProfile): string {
  const names = infraProfile.envVars.map((v) => v.name);
  if (names.length === 0) return "";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")}…`;
}

function envServicesLabel(infraProfile: InfraProfile): string {
  return [
    infraProfile.primaryBackend === "supabase" ? "Supabase" : null,
    infraProfile.services.includes("payments") ? "Stripe" : null,
    infraProfile.services.includes("email") ? "Resend" : null,
    infraProfile.services.includes("ai") ? "OpenAI" : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatTestFlows(features: string[], language: BuildPromptLanguage): string {
  const picked = features.slice(0, 4);
  if (picked.length === 0) {
    return language === "en"
      ? "signup → onboarding → core action"
      : "inscription → onboarding → action principale";
  }
  const flows = picked.map((f) => f.replace(/\.$/, "").toLowerCase());
  if (language === "en") {
    return `signup → ${flows.join(" → ")}`;
  }
  return `inscription → ${flows.join(" → ")}`;
}

function planModeStep(tool: BuildTool, language: BuildPromptLanguage): SetupGuideStep {
  const hints: Partial<Record<string, string>> = {
    cursor:
      "Shift+Tab dans le chat Agent pour le mode Plan — surtout utile pour les gros changements (nouvelle feature, refonte). Décrivez l'objectif, validez le plan proposé, puis lancez.",
    windsurf:
      "Demandez d'abord un plan d'implémentation détaillé (fichiers, schéma BDD, écrans) avant d'autoriser le code.",
    "claude-code":
      "Demandez un plan complet (structure, dépendances, schéma) dans le terminal avant l'implémentation.",
    replit:
      "Avec l'Agent Replit, demandez un plan (composants, auth, BDD) et validez-le avant le build.",
    bolt:
      "Décrivez l'architecture dans le chat et affinez la structure avant de lancer la génération.",
  };

  const body =
    hints[tool.id] ??
    (language === "en"
      ? `Use ${tool.name}'s planning mode to review architecture before building.`
      : `Utilisez le mode plan de ${tool.name} pour valider l'architecture avant de construire.`);

  return {
    kind: "plan_mode",
    title: language === "en" ? "Plan first" : "Mode plan",
    body,
    recommended: true,
  };
}

function supabaseStep(language: BuildPromptLanguage): SetupGuideStep {
  return {
    kind: "infra",
    title: language === "en" ? "Supabase project" : "Projet Supabase",
    body:
      language === "en"
        ? "Create a free project at supabase.com. Note the project URL and anon key (Settings → API). Enable email/password auth in Authentication → Providers."
        : "Créez un projet gratuit sur supabase.com. Notez l'URL du projet et la clé anon (Settings → API). Activez l'auth email/mot de passe dans Authentication → Providers.",
  };
}

function pastePromptStep(tool: BuildTool, language: BuildPromptLanguage): SetupGuideStep {
  const openHints: Partial<Record<string, string>> = {
    cursor: "Ouvrez Cursor, créez ou ouvrez un dossier projet, puis ouvrez le chat Agent.",
    lovable: "Ouvrez votre projet dans Lovable (ou créez-en un nouveau).",
    base44: "Ouvrez Base44 et démarrez un nouveau projet.",
    bolt: "Ouvrez bolt.new et créez un nouveau projet.",
    v0: "Ouvrez v0 et démarrez un nouveau chat/projet.",
    replit: "Ouvrez Replit et créez un Repl pour votre app.",
    windsurf: "Ouvrez Windsurf dans le dossier où le code sera généré.",
    "claude-code": "Placez-vous dans le dossier projet dans votre terminal avec Claude Code.",
  };

  const open =
    openHints[tool.id] ??
    (language === "en" ? `Open ${tool.name}.` : `Ouvrez ${tool.name}.`);

  const paste =
    language === "en"
      ? "Copy the full MVP prompt above and paste it into the chat — then send."
      : "Copiez le prompt MVP ci-dessus en entier et collez-le dans le chat — puis envoyez.";

  return {
    kind: "paste_prompt",
    title: language === "en" ? `Paste the prompt in ${tool.name}` : `Coller le prompt dans ${tool.name}`,
    body: `${open} ${paste}`,
  };
}

function envStep(
  tool: BuildTool,
  infraProfile: InfraProfile,
  language: BuildPromptLanguage,
): SetupGuideStep | null {
  if (tool.level === "nocode") return null;

  if (tool.level === "intermediate") {
    return {
      kind: "env",
      title: language === "en" ? "Keys & secrets" : "Clés et secrets",
      body:
        language === "en"
          ? `Configure auth, database and API keys through ${tool.name}'s interface or project settings.`
          : `Configurez auth, base de données et clés API via l'interface de ${tool.name} ou les réglages du projet.`,
    };
  }

  const services = envServicesLabel(infraProfile);
  const keys = envKeyNames(infraProfile);

  return {
    kind: "env",
    title: language === "en" ? "Environment variables" : "Variables d'environnement",
    body:
      language === "en"
        ? `Check that \`.env.example\` was created, copy it to \`.env.local\`, and fill in your real keys${services ? ` (${services})` : ""}${keys ? `: ${keys}` : ""}. Never commit \`.env.local\`.`
        : `Vérifiez que \`.env.example\` a été créé, copiez-le en \`.env.local\`, et renseignez vos vraies clés${services ? ` (${services})` : ""}${keys ? ` : ${keys}` : ""}. Ne committez jamais \`.env.local\`.`,
  };
}

function managedInfraStep(tool: BuildTool, language: BuildPromptLanguage): SetupGuideStep {
  return {
    kind: "infra",
    title: language === "en" ? "Auth & database" : "Auth et base de données",
    body:
      language === "en"
        ? `Set up signup/login and data storage through ${tool.name}'s native interface — no manual backend setup.`
        : `Configurez inscription/connexion et stockage des données via l'interface native de ${tool.name} — pas de backend manuel.`,
  };
}

function testStep(
  tool: BuildTool,
  productName: string,
  features: string[],
  language: BuildPromptLanguage,
): SetupGuideStep {
  const flows = formatTestFlows(features, language);
  const runHint =
    tool.level === "advanced"
      ? language === "en"
        ? "Run locally (`npm install` then `npm run dev`) and open http://localhost:3000."
        : "Lancez en local (`npm install` puis `npm run dev`) et ouvrez http://localhost:3000."
      : language === "en"
        ? "Use the tool's preview to walk through the main journey."
        : "Utilisez la preview de l'outil pour parcourir le flux principal.";

  return {
    kind: "test",
    title: language === "en" ? "Test the MVP" : "Tester le MVP",
    body:
      language === "en"
        ? `For ${productName}, verify: ${flows}. ${runHint}`
        : `Pour ${productName}, vérifiez : ${flows}. ${runHint}`,
  };
}

function iterateStep(tool: BuildTool, language: BuildPromptLanguage): SetupGuideStep {
  return {
    kind: "iterate",
    title: language === "en" ? "Iterate" : "Itérer",
    body:
      language === "en"
        ? `Keep chatting in ${tool.name} to fix bugs, adjust UX, or add details — no need to regenerate from scratch.`
        : `Continuez à discuter dans ${tool.name} pour corriger, ajuster l'UX ou enrichir — pas besoin de tout régénérer.`,
  };
}

function deployStep(tool: BuildTool, language: BuildPromptLanguage): SetupGuideStep | null {
  if (tool.deployModel === "builtin") {
    return {
      kind: "generic",
      title: language === "en" ? "Go live" : "Mettre en ligne",
      body:
        language === "en"
          ? `When the MVP works: click ${tool.publishLabel} in ${tool.name}, then paste your production URL in the tracking section below.`
          : `Quand le MVP fonctionne : cliquez sur ${tool.publishLabel} dans ${tool.name}, puis indiquez l'URL de production dans le suivi ci-dessous.`,
    };
  }
  if (tool.deployModel === "github-vercel") {
    return {
      kind: "generic",
      title: language === "en" ? "Go live" : "Mettre en ligne",
      body:
        language === "en"
          ? "When the MVP works locally: use the « Deploy your app » section below for copy-paste prompts."
          : "Quand le MVP fonctionne en local : section « Mettre mon app en ligne » ci-dessous — prompts à copier.",
    };
  }
  return null;
}

/** Trame de démarrage fiable — adaptée à l'outil et au projet, indépendante du LLM. */
export function buildSetupGuideSteps(params: {
  tool: BuildTool;
  productName: string;
  features: string[];
  infraProfile: InfraProfile;
  language: BuildPromptLanguage;
}): SetupGuideStep[] {
  const { tool, productName, features, infraProfile, language } = params;
  const steps: SetupGuideStep[] = [];

  if (TOOLS_WITH_PLAN_MODE.has(tool.id) && tool.level !== "nocode") {
    steps.push(planModeStep(tool, language));
  }

  if (tool.level === "advanced" && infraProfile.primaryBackend === "supabase") {
    steps.push(supabaseStep(language));
  }

  steps.push(pastePromptStep(tool, language));

  if (
    infraProfile.mode !== "managed" &&
    (tool.level === "nocode" ||
      (tool.level === "intermediate" && infraProfile.mode === "interface-native"))
  ) {
    steps.push(managedInfraStep(tool, language));
  }

  const env = envStep(tool, infraProfile, language);
  if (env) steps.push(env);

  steps.push(testStep(tool, productName, features, language));
  steps.push(iterateStep(tool, language));

  const deploy = deployStep(tool, language);
  if (deploy) steps.push(deploy);

  return steps;
}

export function buildSetupGuideFromOpportunity(params: {
  tool: BuildTool;
  productName: string;
  opportunity: Opportunity;
  infraProfile: InfraProfile;
  language: BuildPromptLanguage;
}): SetupGuideStep[] {
  return buildSetupGuideSteps({
    ...params,
    features: collectProductFeatures(params.opportunity),
  });
}

/** Sérialise pour le champ legacy setupRecipe (affichage + persistance). */
export function serializeSetupRecipe(steps: SetupGuideStep[]): string {
  return steps.map((step) => `${step.title} : ${step.body}`).join("\n");
}

export function getSetupGuideSubtitle(tool: BuildTool, language: BuildPromptLanguage): string {
  if (language === "en") {
    return `Step-by-step in ${tool.name}`;
  }
  return `Étapes concrètes dans ${tool.name}`;
}
