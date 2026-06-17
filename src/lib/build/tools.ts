import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";

export type BuildToolLevel = "nocode" | "intermediate" | "advanced";
export type BuildDeployModel = "builtin" | "github-vercel";

export type BuildToolId =
  | "base44"
  | "lovable"
  | "bolt"
  | "v0"
  | "replit"
  | "cursor"
  | "claude-code"
  | "windsurf";

export type BuildTool = {
  id: BuildToolId;
  name: string;
  level: BuildToolLevel;
  pitch: string;
  ownsCode: boolean;
  deployModel: BuildDeployModel;
  deepLink: string;
  publishLabel: string;
};

export const BUILD_TOOL_LEVELS: Record<
  BuildToolLevel,
  { label: string; description: string }
> = {
  nocode: {
    label: "Sans code",
    description: "Le plus simple — décrivez votre app, l'IA la construit pour vous.",
  },
  intermediate: {
    label: "Intermédiaire",
    description: "Un peu plus de contrôle, toujours guidé par l'IA.",
  },
  advanced: {
    label: "Avancé",
    description: "Éditeur IA sur votre machine — contrôle total du code.",
  },
};

export const BUILD_TOOLS: BuildTool[] = [
  {
    id: "base44",
    name: "Base44",
    level: "nocode",
    pitch: "Tout-en-un : base de données, auth et hébergement inclus. Zéro configuration.",
    ownsCode: false,
    deployModel: "builtin",
    deepLink: "https://base44.com",
    publishLabel: "Publier sur Base44",
  },
  {
    id: "lovable",
    name: "Lovable",
    level: "nocode",
    pitch: "Qualité pro, sync GitHub possible. Idéal pour un vrai SaaS.",
    ownsCode: true,
    deployModel: "builtin",
    deepLink: "https://lovable.dev",
    publishLabel: "Publier sur Lovable",
  },
  {
    id: "bolt",
    name: "Bolt.new",
    level: "nocode",
    pitch: "Prototype ultra-rapide dans le navigateur. Export vers GitHub.",
    ownsCode: true,
    deployModel: "github-vercel",
    deepLink: "https://bolt.new",
    publishLabel: "Exporter puis déployer",
  },
  {
    id: "v0",
    name: "v0",
    level: "intermediate",
    pitch: "Interface soignée + déploiement Vercel en 1 clic.",
    ownsCode: true,
    deployModel: "builtin",
    deepLink: "https://v0.dev",
    publishLabel: "Déployer sur Vercel",
  },
  {
    id: "replit",
    name: "Replit",
    level: "intermediate",
    pitch: "IDE cloud avec agent autonome. Déploiement intégré.",
    ownsCode: true,
    deployModel: "builtin",
    deepLink: "https://replit.com",
    publishLabel: "Déployer sur Replit",
  },
  {
    id: "cursor",
    name: "Cursor",
    level: "advanced",
    pitch: "Éditeur IA avec accès complet au code. Le standard des devs solo.",
    ownsCode: true,
    deployModel: "github-vercel",
    deepLink: "https://cursor.com",
    publishLabel: "Pousser sur GitHub",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    level: "advanced",
    pitch: "Agent IA en terminal. Parfait pour construire feature par feature.",
    ownsCode: true,
    deployModel: "github-vercel",
    deepLink: "https://claude.ai/code",
    publishLabel: "Pousser sur GitHub",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    level: "advanced",
    pitch: "Éditeur IA avec flow agentique. Alternative à Cursor.",
    ownsCode: true,
    deployModel: "github-vercel",
    deepLink: "https://codeium.com/windsurf",
    publishLabel: "Pousser sur GitHub",
  },
];

export function getBuildTool(id: string): BuildTool | undefined {
  return BUILD_TOOLS.find((t) => t.id === id);
}

export function getToolsByLevel(level: BuildToolLevel): BuildTool[] {
  return BUILD_TOOLS.filter((t) => t.level === level);
}

export function recommendTool(
  _project: UserProject,
  _opportunity: Opportunity,
): BuildToolId {
  if (_project.builderStage === "has_mrr" || _project.builderStage === "building") {
    return "lovable";
  }
  return "base44";
}
