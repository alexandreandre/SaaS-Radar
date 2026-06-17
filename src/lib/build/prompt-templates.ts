import type { Opportunity } from "@/types/opportunity";
import type { BuildTool } from "@/lib/build/tools";

export type BuildPromptContext = {
  opportunity: Opportunity;
  tool: BuildTool;
  featureIndex?: number;
};

export function buildSystemPrompt(): string {
  return `Tu es un coach produit expert qui aide des fondateurs solo français à construire leur MVP.
Tu réponds UNIQUEMENT en JSON valide avec exactement ces clés :
- "mvpPrompt" : le prompt complet à coller dans l'outil de build choisi pour générer le MVP entier en une fois
- "setupRecipe" : recette de cuisine étape par étape (créer le compte, coller le prompt, premières itérations) — langage simple, pas de jargon technique inutile
- "quickStart" : guide ultra-court (3-5 bullets) pour démarrer dans l'outil en moins de 5 minutes

Règles :
- Français, vouvoiement, ton direct et encourageant
- Adapter le niveau technique au profil de l'outil (no-code = très simple, avancé = plus précis)
- Ne pas lister de stack technique (Next.js, Supabase, etc.) sauf si l'outil l'exige explicitement
- Le mvpPrompt doit produire un MVP monétisable complet : landing, auth, workflow principal, paiement si pertinent
- setupRecipe : numérotée, actionnable, sans ambiguïté`;
}

export function buildUserPrompt(ctx: BuildPromptContext): string {
  const { opportunity, tool, featureIndex } = ctx;
  const features = opportunity.mvpPlan.features;
  const featureLine =
    featureIndex !== undefined && features[featureIndex]
      ? `\nFocus sur la feature : "${features[featureIndex]}"`
      : "";

  return `Opportunité : ${opportunity.name}
Pitch : ${opportunity.pitch}
Cible : ${opportunity.targetClient}
Secteur : ${opportunity.sector}

Features MVP à inclure :
${features.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Hors scope (pas au J1) :
${opportunity.mvpPlan.notYet.map((n) => `- ${n}`).join("\n")}

Outil choisi : ${tool.name} (niveau ${tool.level})
Modèle de déploiement : ${tool.deployModel === "builtin" ? "publish intégré dans l'outil" : "export GitHub puis Vercel"}${featureLine}

Génère le JSON avec mvpPrompt, setupRecipe et quickStart adaptés à ${tool.name}.`;
}

export function buildDeployRecipePrompt(
  opportunity: Opportunity,
  tool: BuildTool,
): string {
  return `Tu génères une recette de déploiement pour un fondateur solo français.

Projet : ${opportunity.name}
Outil de build : ${tool.name}

Retourne UNIQUEMENT du texte markdown court (max 12 étapes) pour déployer ce MVP.
${tool.deployModel === "builtin" ? `L'outil a un bouton Publish intégré — guidez vers ce flux.` : `Le déploiement passe par GitHub + Vercel. Incluez : créer le repo, pousser le code, connecter Vercel, variables d'environnement, premier déploiement.`}

Pas de jargon inutile. Chaque étape = une action claire.`;
}
