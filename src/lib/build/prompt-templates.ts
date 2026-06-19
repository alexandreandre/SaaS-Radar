import type { Opportunity } from "@/types/opportunity";
import type { BuildTool } from "@/lib/build/tools";
import {
  type BuildPromptLanguage,
  BUILD_PROMPT_LANGUAGE_LABELS,
} from "@/lib/build/prompt-language";
import {
  collectProductFeatures,
  getInfraPromptBlock,
  type InfraProfile,
} from "@/lib/build/infra-profile";
import { TOOLS_WITH_PLAN_MODE } from "@/lib/build/tool-constants";

export type BuildPromptContext = {
  opportunity: Opportunity;
  productName: string;
  tool: BuildTool;
  language: BuildPromptLanguage;
  featureIndex?: number;
  infraProfile: InfraProfile;
};

function toolSpecificRules(
  tool: BuildTool,
  language: BuildPromptLanguage,
  infraProfile: InfraProfile,
): string {
  if (tool.id === "emergent") {
    const stripeHint = infraProfile.services.includes("payments")
      ? language === "en"
        ? "- Mention Stripe setup in section 6 if monetization is required"
        : "- Mentionner Stripe en section 6 si monétisation requise"
      : "";
    if (language === "en") {
      return `- Describe the app in natural language; let Emergent's agents (architect, frontend, backend) coordinate the build
- Explicitly require: email/password auth, data persistence, signup → core action journey
- Prefer Supabase for auth/database if Emergent offers the integration; otherwise configure via Emergent interface
${stripeHint}
- Delivery: build a testable MVP in preview — not a skeleton
- Keep iterating in Emergent chat feature by feature`;
    }
    return `- Décrivez l'app en langage naturel ; laissez les agents Emergent (architecte, frontend, backend) coordonner le build
- Exiger explicitement : auth email/mot de passe, persistance des données, parcours inscription → action clé
- Préférer Supabase pour auth/BDD si Emergent propose l'intégration ; sinon configurer via l'interface Emergent
${stripeHint}
- Livraison : MVP testable en preview — pas un squelette
- Itérer dans le chat Emergent feature par feature`;
  }

  if (tool.id === "codex") {
    if (language === "en") {
      return `- Create a root \`AGENTS.md\` file (stack, conventions, npm commands, MVP scope) — Codex reads it for context
- Initialize git, make atomic commits, push to GitHub when the MVP runs locally
- Run \`npm install && npm run dev\` to validate before deploying
- Use Codex approval modes — confirm before destructive shell commands
- Mention \`/model\` if the founder needs to switch models`;
    }
    return `- Créer un fichier \`AGENTS.md\` à la racine (stack, conventions, commandes npm, périmètre MVP) — Codex s'en sert comme contexte
- Initialiser git, commits atomiques, push GitHub quand le MVP tourne en local
- Lancer \`npm install && npm run dev\` pour valider avant déploiement
- Utiliser les modes d'approbation Codex — confirmer avant les commandes shell destructives
- Mentionner \`/model\` si le fondateur doit changer de modèle`;
  }

  return "";
}

function languageRules(language: BuildPromptLanguage): string {
  if (language === "en") {
    return `- ALL output in English (mvpPrompt)
- Direct, encouraging tone for a solo founder
- Use "you" — clear and actionable`;
  }
  return `- TOUT en français (mvpPrompt)
- Vouvoiement, ton direct et encourageant
- Phrases courtes, zéro jargon inutile`;
}

function secretsSectionRules(
  tool: BuildTool,
  language: BuildPromptLanguage,
  infraProfile: InfraProfile,
): string {
  const envList = infraProfile.envVars.map((v) => v.name).join(", ");

  if (tool.level === "nocode" || tool.level === "intermediate") {
    if (language === "en") {
      return `Section 6 (Configuration & secrets) for ${tool.name}:
- Configure auth, database and API keys through ${tool.name}'s native interface
- List every key/setting the founder must provide (name, role, where to get it — no real secrets)
- Remind them never to share real keys in chat`;
    }
    return `Section 6 (Configuration & secrets) pour ${tool.name} :
- Configurer auth, base de données et clés API via l'interface native de ${tool.name}
- Lister chaque clé/réglage que le fondateur devra renseigner (nom, rôle, où l'obtenir — jamais de vraies clés)
- Rappeler de ne jamais partager de vraies clés dans le chat`;
  }
  if (language === "en") {
    return `Section 6 (Configuration & secrets) — mandatory for code-based tools:
- Create .env.example with all keys as placeholders (YOUR_API_KEY)
- Required variables: ${envList || "all API keys for the recommended stack"}
- Create .env.local for local dev (gitignored)
- Never commit real secrets
- List each variable: name, role, where to obtain it
- Mirror the same keys in GitHub Secrets (Settings → Secrets and variables → Actions) and Vercel Environment Variables when deploying`;
  }
  return `Section 6 (Configuration & secrets) — obligatoire pour les outils code :
- Créer .env.example avec toutes les clés en placeholder (YOUR_API_KEY)
- Variables requises : ${envList || "toutes les clés API de la stack recommandée"}
- Créer .env.local pour le dev local (gitignoré)
- Ne jamais committer de vraies clés
- Lister chaque variable : nom, rôle, où l'obtenir
- Reprendre les mêmes clés dans GitHub Secrets (Settings → Secrets and variables → Actions) et Vercel Environment Variables au déploiement`;
}

function toolLevelRules(
  tool: BuildTool,
  language: BuildPromptLanguage,
  infraProfile: InfraProfile,
): string {
  const iterateHint =
    language === "en"
      ? "Remind the founder they can keep chatting to iterate — the first prompt lays the foundation."
      : "Rappelez que le fondateur peut continuer à discuter pour itérer — le premier prompt pose les bases.";

  const planModeHint = TOOLS_WITH_PLAN_MODE.has(tool.id)
    ? language === "en"
      ? `Mention ${tool.name}'s plan mode in the mvpPrompt delivery instruction if relevant.`
      : `Mentionner le mode plan de ${tool.name} dans la consigne de livraison du mvpPrompt si pertinent.`
    : "";

  if (tool.level === "nocode") {
    return `- mvpPrompt : adressez-vous à l'IA de ${tool.name} comme à un builder no-code — décrivez l'app complète, écran par écran
- ${getInfraPromptBlock(infraProfile, language)}
- ${secretsSectionRules(tool, language, infraProfile)}
- ${iterateHint}`;
  }
  if (tool.level === "intermediate") {
    const lines = [
      `- mvpPrompt : guidé mais complet — parcours utilisateur + écrans clés + comportements attendus + finitions`,
      `- ${getInfraPromptBlock(infraProfile, language)}`,
      `- ${tool.name} gère la technique : restez produit mais mentionnez auth et persistance explicitement`,
      `- ${secretsSectionRules(tool, language, infraProfile)}`,
    ];
    const specific = toolSpecificRules(tool, language, infraProfile);
    if (specific) lines.push(...specific.split("\n").filter(Boolean));
    lines.push(`- ${iterateHint}`);
    if (planModeHint) lines.push(`- ${planModeHint}`);
    return lines.join("\n");
  }

  const stackLine = infraProfile.recommendedStack.join(", ");
  const specific = toolSpecificRules(tool, language, infraProfile);
  if (language === "en") {
    const lines = [
      `- mvpPrompt : full product + architecture prompt for ${tool.name}`,
      `- Mandatory section 5b "Recommended architecture & stack" — use stack: ${stackLine}`,
      `- Describe minimal database schema (tables, relations, Supabase RLS policies)`,
      `- Acceptable alternative: Firebase Auth + Firestore — one sentence only if justified`,
      `- Forbidden: localStorage-only persistence, hardcoded data, TODOs left behind`,
      `- ${getInfraPromptBlock(infraProfile, language)}`,
      `- ${secretsSectionRules(tool, language, infraProfile)}`,
    ];
    if (specific) lines.push(...specific.split("\n").filter(Boolean));
    if (planModeHint) lines.push(`- ${planModeHint}`);
    lines.push(`- ${iterateHint}`);
    return lines.join("\n");
  }
  const lines = [
    `- mvpPrompt : prompt PRODUIT + architecture prêt à coller dans ${tool.name}`,
    `- Section 5 bis « Architecture & stack recommandée » OBLIGATOIRE — stack : ${stackLine}`,
    `- Décrire le schéma BDD minimal (tables, relations, politiques RLS Supabase)`,
    `- Alternative acceptable : Firebase Auth + Firestore — une phrase si justifié`,
    `- Interdit : localStorage seul, données en dur, TODO laissés`,
    `- ${getInfraPromptBlock(infraProfile, language)}`,
    `- ${secretsSectionRules(tool, language, infraProfile)}`,
  ];
  if (specific) lines.push(...specific.split("\n").filter(Boolean));
  if (planModeHint) lines.push(`- ${planModeHint}`);
  lines.push(`- ${iterateHint}`);
  return lines.join("\n");
}

function mvpPromptStructure(tool: BuildTool, language: BuildPromptLanguage): string {
  const advancedSection =
    tool.level === "advanced"
      ? language === "en"
        ? `5b. Recommended architecture & stack — framework, BaaS, minimal schema, RLS/auth
`
        : `5 bis. Architecture & stack recommandée — framework, BaaS, schéma minimal, RLS/auth
`
      : "";

  if (language === "en") {
    return `Mandatory mvpPrompt structure (sections with clear headings):
1. Product context — what we build, for whom, and why now
2. Target user — persona and main job-to-be-done
3. Complete user journey — signup → onboarding → core action → retention (not just the happy path)
4. Features to deliver — each feature with concrete, observable acceptance criteria
5. Product polish — auth, profile/settings, empty & error states, responsive, basic SEO, monetization if relevant
${advancedSection}6. Configuration & secrets — .env.example, .env.local (gitignored), no committed secrets, GitHub Secrets + Vercel env vars for deploy
7. UX & quality — testable locally and in production
8. Delivery instruction — build a near-complete, cohesive product in ${"{tool}"} in one pass; no skeletons or TODOs left behind`;
  }
  return `Structure obligatoire du mvpPrompt (sections avec titres clairs) :
1. Contexte produit — ce qu'on construit, pour qui, et pourquoi maintenant
2. Utilisateur cible — persona et job-to-be-done principal
3. Parcours utilisateur complet — inscription → onboarding → action clé → rétention (pas seulement le happy path)
4. Fonctionnalités à livrer — chaque feature avec critères d'acceptation observables
5. Finitions produit — auth, profil/settings, états vides/erreur, responsive, SEO de base, monétisation si pertinent
${advancedSection}6. Configuration & secrets — .env.example, .env.local (gitignoré), jamais de vraies clés commitées, GitHub Secrets + Vercel Environment Variables au déploiement
7. UX & qualité — testable en local et en production
8. Consigne de livraison — construire un produit quasi-complet et cohérent dans l'outil en une passe ; pas de squelette ni de TODO laissés en plan`;
}

export function buildSystemPrompt(
  tool: BuildTool,
  language: BuildPromptLanguage,
  infraProfile: InfraProfile,
): string {
  const langLabel = BUILD_PROMPT_LANGUAGE_LABELS[language];

  return `Tu es un coach produit senior qui aide des fondateurs solo à livrer un produit quasi-complet, prêt à shipper.
Langue de sortie : ${langLabel}.

Tu réponds UNIQUEMENT en JSON valide avec exactement cette clé (chaîne de caractères, jamais de tableau) :
- "mvpPrompt" : le prompt complet à coller dans ${tool.name} pour générer le produit entier

Note : le guide « Comment démarrer » est généré côté produit — concentrez-vous uniquement sur mvpPrompt.

${mvpPromptStructure(tool, language).replace("{tool}", tool.name)}

Brief infrastructure (à intégrer dans le mvpPrompt) :
${getInfraPromptBlock(infraProfile, language)}

Qualité du mvpPrompt :
- Longueur cible : 500 à 900 mots — précis et actionnable, pas du remplissage
- Chaque feature du brief doit apparaître avec un comportement observable
- Inclure auth, onboarding, états vides/erreur et configuration secrets
- Ton : fondateur solo qui veut shipper cette semaine avec un produit abouti

${languageRules(language)}

${toolLevelRules(tool, language, infraProfile)}`;
}

export function buildUserPrompt(ctx: BuildPromptContext): string {
  const { opportunity, tool, language, featureIndex, infraProfile } = ctx;
  const features = collectProductFeatures(opportunity);
  const featureLine =
    featureIndex !== undefined && features[featureIndex]
      ? `\nFocus feature : "${features[featureIndex]}"`
      : "";

  const langNote =
    language === "en"
      ? "Generate all JSON values in English."
      : "Génère toutes les valeurs JSON en français.";

  const servicesLine =
    language === "en"
      ? `\nRequired infrastructure services: ${infraProfile.services.join(", ")}`
      : `\nServices infra requis : ${infraProfile.services.join(", ")}`;

  const stackBlock =
    infraProfile.recommendedStack.length > 0
      ? tool.level === "advanced"
        ? language === "en"
          ? `\nStack to use (mandatory unless Firebase alternative justified):\n${infraProfile.recommendedStack.map((s) => `- ${s}`).join("\n")}`
          : `\nStack à utiliser (obligatoire sauf alternative Firebase justifiée) :\n${infraProfile.recommendedStack.map((s) => `- ${s}`).join("\n")}`
        : language === "en"
          ? `\nSuggested stack (reference):\n${infraProfile.recommendedStack.map((s) => `- ${s}`).join("\n")}`
          : `\nStack suggérée (référence) :\n${infraProfile.recommendedStack.map((s) => `- ${s}`).join("\n")}`
      : "";

  const envBlock =
    infraProfile.envVars.length > 0
      ? language === "en"
        ? `\nEnvironment variables for .env.example:\n${infraProfile.envVars.map((v) => `- ${v.name}: ${v.role}`).join("\n")}`
        : `\nVariables d'environnement pour .env.example :\n${infraProfile.envVars.map((v) => `- ${v.name} : ${v.role}`).join("\n")}`
      : "";

  const checklistBlock =
    opportunity.mvpPlan.launchChecklist && opportunity.mvpPlan.launchChecklist.length > 0
      ? language === "en"
        ? `\nShip-ready criteria (reflect in delivery instruction):\n${opportunity.mvpPlan.launchChecklist.slice(0, 5).map((c) => `- ${c}`).join("\n")}`
        : `\nCritères prêt à shipper (à refléter dans la consigne de livraison) :\n${opportunity.mvpPlan.launchChecklist.slice(0, 5).map((c) => `- ${c}`).join("\n")}`
      : "";

  const bonusBlock =
    opportunity.mvpPlan.notYet.length > 0
      ? language === "en"
        ? `\nInclude also if feasible without bloating:\n${opportunity.mvpPlan.notYet.map((n) => `- ${n}`).join("\n")}`
        : `\nInclure aussi si faisable sans alourdir :\n${opportunity.mvpPlan.notYet.map((n) => `- ${n}`).join("\n")}`
      : "";

  const featuresLabel =
    language === "en"
      ? "Features to deliver (cover entirely in mvpPrompt)"
      : "Fonctionnalités à livrer (à couvrir intégralement dans le mvpPrompt)";

  return `Produit : ${ctx.productName}
Inspiration (ne pas copier ce nom) : ${opportunity.name}
Pitch : ${opportunity.pitch}
Cible : ${opportunity.targetClient}
Secteur : ${opportunity.sector}

${featuresLabel} :
${features.map((f, i) => `${i + 1}. ${f}`).join("\n")}${servicesLine}${stackBlock}${envBlock}${checklistBlock}${bonusBlock}

Outil : ${tool.name} (niveau ${tool.level})
Déploiement : ${tool.deployModel === "builtin" ? "publish intégré" : "GitHub puis Vercel"}${featureLine}

${langNote}

Génère le JSON (mvpPrompt) optimisé pour ${tool.name}.`;
}

export function buildDeployRecipePrompt(
  opportunity: Opportunity,
  tool: BuildTool,
  productName: string,
): string {
  const deployDetail =
    tool.deployModel === "builtin"
      ? `L'outil a un bouton Publish intégré — guidez vers ce flux.`
      : `Le déploiement passe par GitHub + Vercel. Incluez :
- Créer le repo et pousser le code (.env.local dans .gitignore, .env.example commité)
- GitHub Secrets : reprendre chaque clé de .env.example (Settings → Secrets and variables → Actions)
- Connecter Vercel, copier les mêmes variables (Settings → Environment Variables)
- Premier déploiement puis Redeploy si les variables ont été ajoutées après`;

  return `Tu génères une recette de déploiement pour un fondateur solo français.

Projet : ${productName}
Inspiration (ne pas copier) : ${opportunity.name}
Outil de build : ${tool.name}

Retourne UNIQUEMENT du texte markdown court (max 12 étapes) pour déployer ce produit.
${deployDetail}

Pas de jargon inutile. Chaque étape = une action claire.`;
}
