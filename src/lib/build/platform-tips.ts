import type { BuildToolId } from "@/lib/build/tools";

export type PlatformShortcut = {
  keys: string;
  label: string;
};

export type PlatformTips = {
  iterationHint: string;
  iteratePrompt: string;
  planMode?: {
    lead: string;
    steps: string[];
  };
  localRun?: {
    lead: string;
    askPrompt: string;
    prerequisites: string[];
    commands?: string[];
  };
  shortcuts?: PlatformShortcut[];
};

const CURSOR_SHORTCUTS: PlatformShortcut[] = [
  { keys: "⌘ N", label: "Nouvelle discussion" },
  { keys: "⌘ J", label: "Ouvrir le terminal intégré" },
  { keys: "⌘ L", label: "Depuis le terminal : envoyer l'erreur au chat" },
  { keys: "⌘ ⇧ J", label: "Vérifier votre usage Cursor" },
  { keys: "↑", label: "Rappeler la commande terminal précédente" },
];

const TIPS: Partial<Record<BuildToolId, PlatformTips>> = {
  cursor: {
    iterationHint:
      "Le premier prompt lance la base — ensuite, continuez à discuter dans Cursor pour corriger, ajouter des écrans ou affiner le design. Pas besoin de tout régénérer.",
    iteratePrompt:
      "Améliore [décrivez ce que vous voulez changer]. Garde le reste de l'app tel quel et explique ce que tu modifies.",
    planMode: {
      lead:
        "Particulièrement utile pour les changements structurants — nouvelle feature, refonte d'un parcours, intégration paiement ou base de données. L'IA formalise d'abord un plan d'architecture avant de coder, que ce soit au premier prompt ou plus tard dans le projet.",
      steps: [
        "Dans le chat Agent, appuyez sur Shift+Tab pour activer le mode Plan.",
        "Décrivez ce que vous voulez construire ou modifier ; répondez aux questions de clarification.",
        "Relisez le plan proposé, ajustez si besoin, puis lancez la construction.",
      ],
    },
    localRun: {
      lead: "Testez en local avant de déployer — demandez à Cursor de vous guider.",
      askPrompt:
        "Comment lancer ce projet en local sur ma machine ? Donne les prérequis (Node, etc.) et les commandes exactes à exécuter dans le terminal.",
      prerequisites: ["Node.js 18+ (nodejs.org)", "Projet ouvert dans Cursor"],
      commands: ["npm install", "npm run dev"],
    },
    shortcuts: CURSOR_SHORTCUTS,
  },
  emergent: {
    iterationHint:
      "Le premier prompt pose les fondations — enchaînez dans le chat Emergent pour affiner écran par écran et feature par feature.",
    iteratePrompt:
      "Ajoute [votre demande]. Ne casse pas le parcours principal.",
    planMode: {
      lead:
        "Recommandé avant un gros build — Emergent propose un plan d'architecture (écrans, BDD, auth) que vous validez avant la génération.",
      steps: [
        "Décrivez l'objectif produit complet et les intégrations nécessaires (auth, BDD, paiement).",
        "Relisez le plan proposé par les agents Emergent et ajustez si besoin.",
        "Autorisez le build une fois le plan validé.",
      ],
    },
  },
  codex: {
    iterationHint:
      "Construisez feature par feature dans le terminal Codex — un message = une amélioration ciblée.",
    iteratePrompt:
      "Implémente [feature ou correction]. Vérifie que le parcours principal fonctionne toujours.",
    planMode: {
      lead:
        "Recommandé pour les évolutions lourdes — demandez un plan d'implémentation détaillé avant d'écrire le code.",
      steps: [
        "Décrivez l'objectif et demandez un plan (fichiers, schéma BDD, écrans).",
        "Validez ou ajustez le plan proposé.",
        "Autorisez l'implémentation selon ce plan.",
      ],
    },
    localRun: {
      lead: "Codex travaille dans le terminal — demandez-lui de lancer le serveur de dev.",
      askPrompt:
        "Lance ce projet en local (npm install puis npm run dev) et dis-moi sur quelle URL je peux le tester.",
      prerequisites: [
        "Node.js 18+ installé",
        "Codex CLI installé (npm install -g @openai/codex) et codex login effectué",
      ],
      commands: ["npm install", "npm run dev"],
    },
  },
  "claude-code": {
    iterationHint:
      "Construisez feature par feature : un message = une amélioration. Pas besoin de tout refaire d'un coup.",
    iteratePrompt:
      "Implémente [feature ou correction]. Teste que le parcours principal fonctionne toujours.",
    planMode: {
      lead:
        "Recommandé pour les évolutions lourdes — grosse feature, refonte ou migration. Demandez un plan d'implémentation avant d'écrire le code, à tout moment du projet.",
      steps: [
        "Décrivez l'objectif et demandez un plan détaillé (fichiers, étapes, dépendances).",
        "Validez ou ajustez le plan proposé.",
        "Demandez ensuite l'implémentation selon ce plan.",
      ],
    },
    localRun: {
      lead: "Claude Code travaille dans le terminal — demandez-lui de lancer le serveur de dev.",
      askPrompt:
        "Lance ce projet en local et dis-moi sur quelle URL je peux le tester.",
      prerequisites: ["Node.js 18+ installé", "Dépôt cloné ou créé par Claude Code"],
      commands: ["npm install", "npm run dev"],
    },
  },
  bolt: {
    iterationHint:
      "Après le premier build, décrivez les changements dans le chat Bolt — l'app se met à jour au fil de vos messages.",
    iteratePrompt: "Modifie [votre demande] sans toucher au reste du parcours principal.",
    planMode: {
      lead:
        "Utile pour cadrer un gros ajout ou une refonte — Bolt planifie via la discussion avant de générer le code.",
      steps: [
        "Décrivez ce que vous voulez construire ou modifier ; laissez Bolt poser ses questions.",
        "Affinez la structure (pages, flux, intégrations) dans le chat.",
        "Validez puis lancez la génération.",
      ],
    },
    localRun: {
      lead: "Une fois exporté vers GitHub, ouvrez le repo dans Cursor pour le lancer en local.",
      askPrompt:
        "J'ai exporté mon projet Bolt sur GitHub. Comment le lancer en local ?",
      prerequisites: ["Code exporté sur GitHub", "Cursor ou un éditeur installé"],
    },
  },
  replit: {
    iterationHint:
      "Continuez à demander des modifications dans le chat Replit — chaque message affine votre app.",
    iteratePrompt: "Ajoute [votre demande] au projet actuel.",
    planMode: {
      lead:
        "Pour les changements ambitieux, demandez d'abord un plan d'architecture — au lancement comme en cours de projet.",
      steps: [
        "Décrivez l'objectif et demandez un plan (composants, base de données, auth).",
        "Relisez le plan proposé par l'Agent.",
        "Autorisez la construction une fois satisfait.",
      ],
    },
  },
  v0: {
    iterationHint:
      "Itérez dans le chat v0 : décrivez les ajustements visuels ou fonctionnels, puis re-déployez.",
    iteratePrompt: "Ajuste [votre demande] en gardant le style actuel.",
  },
  lovable: {
    iterationHint:
      "Le premier prompt crée la base — continuez à discuter dans Lovable pour peaufiner écran par écran.",
    iteratePrompt: "Améliore [votre demande] sans refaire toute l'app.",
  },
};

export function getPlatformTips(toolId: BuildToolId): PlatformTips | null {
  return TIPS[toolId] ?? null;
}

export function hasPlatformTips(toolId: BuildToolId): boolean {
  return toolId in TIPS;
}
