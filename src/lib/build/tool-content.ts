import type { BuildToolId } from "@/lib/build/tools";

/** Instructions d'ouverture de l'outil avant de coller le prompt (FR). */
export const BUILD_TOOL_OPEN_HINTS: Partial<Record<BuildToolId, string>> = {
  cursor: "Ouvrez Cursor, créez ou ouvrez un dossier projet, puis ouvrez le chat Agent.",
  lovable: "Ouvrez votre projet dans Lovable (ou créez-en un nouveau).",
  base44: "Ouvrez Base44 et démarrez un nouveau projet.",
  bolt: "Ouvrez bolt.new et créez un nouveau projet.",
  v0: "Ouvrez v0 et démarrez un nouveau chat/projet.",
  replit: "Ouvrez Replit et créez un Repl pour votre app.",
  emergent:
    "Ouvrez emergent.sh, créez un compte si besoin, puis démarrez un nouveau projet (web app full-stack).",
  codex:
    "Installez Codex CLI (npm install -g @openai/codex), lancez codex login avec votre compte ChatGPT, créez un dossier projet, puis exécutez codex dans ce dossier.",
  "claude-code": "Placez-vous dans le dossier projet dans votre terminal avec Claude Code.",
};

/** Hints mode plan (FR). */
export const BUILD_TOOL_PLAN_MODE_HINTS: Partial<Record<BuildToolId, string>> = {
  cursor:
    "Shift+Tab dans le chat Agent pour le mode Plan — surtout utile pour les gros changements (nouvelle feature, refonte). Décrivez l'objectif, validez le plan proposé, puis lancez.",
  codex:
    "Demandez d'abord un plan d'implémentation détaillé (fichiers, schéma BDD, écrans) avant d'autoriser les modifications.",
  "claude-code":
    "Demandez un plan complet (structure, dépendances, schéma) dans le terminal avant l'implémentation.",
  replit:
    "Avec l'Agent Replit, demandez un plan (composants, auth, BDD) et validez-le avant le build.",
  bolt:
    "Décrivez l'architecture dans le chat et affinez la structure avant de lancer la génération.",
  emergent:
    "Décrivez d'abord l'objectif complet et laissez Emergent proposer un plan d'architecture (écrans, BDD, auth) avant d'autoriser le build.",
};

/** Étapes deploy intégré (FR) — outils deployModel builtin. */
export const BUILTIN_DEPLOY_STEPS: Partial<Record<BuildToolId, string[]>> = {
  base44: [
    "Ouvrez votre projet dans Base44.",
    "Vérifiez que le MVP fonctionne en preview.",
    "Cliquez sur Publish en haut à droite.",
    "Choisissez un sous-domaine gratuit ou votre domaine.",
    "Partagez l'URL à vos premiers bêta-testeurs.",
  ],
  lovable: [
    "Ouvrez votre projet Lovable.",
    "Testez le parcours principal (inscription → action clé).",
    "Cliquez sur Publish pour mettre en ligne.",
    "Vérifiez l'URL sur mobile.",
  ],
  v0: [
    "Dans v0, cliquez sur Deploy.",
    "Connectez Vercel si demandé.",
    "Votre URL de production est prête en quelques secondes.",
  ],
  replit: [
    "Ouvrez l'onglet Deployments dans Replit.",
    "Cliquez sur Deploy (Autoscale recommandé).",
    "Testez l'URL .replit.app — parcours inscription.",
  ],
  emergent: [
    "Testez le parcours principal en preview Emergent.",
    "(Optionnel, plan Standard+) Connectez GitHub via votre profil → « Save to GitHub ».",
    "Cliquez Deploy — votre URL .emergent.host est prête en ~10–15 min.",
    "Collez l'URL de production dans le suivi The Build Road ci-dessous.",
    "Domaine custom si besoin (réglages Emergent).",
  ],
};
