import type { BuildTool } from "@/lib/build/tools";
import type { BuildPlatformId } from "@/lib/build/brands";
import type { EnvVarSpec } from "@/lib/build/infra-profile";

export type DeployPromptStep = {
  id: string;
  title: string;
  summary: string;
  cursorPrompt: string;
  manualSteps?: string[];
  manualLink?: { href: string; label: string };
  manualPlatform?: BuildPlatformId;
  terminalCommands?: string[];
  envHint?: string;
  envVars?: EnvVarSpec[];
};

function slugifyRepo(slugOrName: string): string {
  return (
    slugOrName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "mon-saas"
  );
}

export function isAgentDrivenDeploy(tool: BuildTool): boolean {
  return tool.deployModel === "github-vercel";
}

function getRepoSlug(productName: string): string {
  return slugifyRepo(productName);
}

export function getVercelManualSteps(productName: string): string[] {
  const repo = getRepoSlug(productName);
  return [
    "Allez sur vercel.com/new et connectez-vous avec votre compte GitHub.",
    `Cliquez « Import » à côté du repo « ${repo} ».`,
    "Laissez les réglages par défaut, puis cliquez « Deploy » (2-3 min).",
    "Settings → Environment Variables : copiez chaque clé de votre .env.example (valeurs réelles, pas les placeholders).",
    "Cliquez « Redeploy » si vous avez ajouté des variables après le premier déploiement.",
    "Copiez l'URL en `.vercel.app` : votre app est en ligne.",
  ];
}

export function getGitHubManualSteps(productName: string): string[] {
  const repo = getRepoSlug(productName);
  return [
    `Allez sur github.com/new et créez un dépôt privé « ${repo} ».`,
    "Ne cochez pas « Add a README » si vous avez déjà du code en local.",
    "Vérifiez que .env et .env.local sont dans .gitignore — .env.example doit être commité.",
    "Dans Cursor : panneau Source Control (icône branche) → « Publish to GitHub » ou « Push ».",
    `Sélectionnez le repo « ${repo} » — vos fichiers sont envoyés sur GitHub.`,
    "Si CI : Settings → Secrets and variables → Actions — ajoutez chaque clé de .env.example.",
    "Vérifiez sur github.com que le code est bien visible.",
  ];
}

export function getDeployPromptSteps(
  tool: BuildTool,
  productName: string,
  expectedEnvVars: EnvVarSpec[] = [],
): DeployPromptStep[] {
  const repo = getRepoSlug(productName);
  const app = productName;
  const envVarList =
    expectedEnvVars.length > 0
      ? expectedEnvVars.map((v) => `- ${v.name} (${v.role})`).join("\n")
      : "Reprennez chaque variable de .env.example";
  const envHint =
    expectedEnvVars.length > 0
      ? `Ajoutez ces variables dans Vercel (Settings → Environment Variables), puis Redeploy :\n${envVarList}`
      : "Reprennez chaque variable de .env.example dans Vercel (Settings → Environment Variables), puis Redeploy.";
  const vercelCursorEnvList =
    expectedEnvVars.length > 0
      ? expectedEnvVars.map((v) => v.name).join(", ")
      : "alignées sur .env.example";

  return [
    {
      id: "github",
      title: "Mettre le code sur GitHub",
      summary:
        "Depuis github.com/new + l'interface Cursor — ou demandez de l'aide à Cursor si vous bloquez.",
      manualSteps: getGitHubManualSteps(productName),
      manualLink: { href: "https://github.com/new", label: "Ouvrir github.com/new" },
      manualPlatform: "github",
      cursorPrompt: `Mon produit « ${app} » est prêt en local dans Cursor.

Je crée le repo à la main sur github.com/new (nom : « ${repo} »). Aide-moi à :
1. Vérifier que .env.local est gitignoré et que .env.example est commité
2. Pousser mon code vers ce repo (terminal ou interface Cursor)
3. Si CI : lister les GitHub Secrets à créer (Settings → Secrets and variables → Actions)
4. Résoudre une erreur git si le push échoue

Reste simple — je préfère l'interface quand c'est possible.`,
      terminalCommands: [
        "git init",
        "git add .",
        'git commit -m "Initial commit"',
        "git branch -M main",
        `git remote add origin https://github.com/VOTRE_COMPTE/${repo}.git`,
        "git push -u origin main",
      ],
    },
    {
      id: "vercel",
      title: "Mettre en ligne sur Vercel",
      summary:
        "Depuis l'interface Vercel (le plus simple) — ou demandez de l'aide à Cursor si vous bloquez.",
      manualSteps: getVercelManualSteps(productName),
      manualLink: { href: "https://vercel.com/new", label: "Ouvrir vercel.com/new" },
      manualPlatform: "vercel",
      envHint,
      envVars: expectedEnvVars.length > 0 ? expectedEnvVars : undefined,
      cursorPrompt: `Mon projet « ${app} » est sur GitHub (repo : ${repo}).

Je préfère passer par l'interface Vercel. Aide-moi à :
1. Vérifier que mon repo est prêt à être importé
2. Lister les variables d'environnement à ajouter dans Vercel (Settings → Environment Variables) — ${vercelCursorEnvList}
3. Me dire quoi faire si le déploiement échoue (souvent une variable manquante)

Reste simple — je configure Vercel à la main sur vercel.com/new.`,
      terminalCommands: [
        "# Alternative CLI (optionnel)",
        "npx vercel login",
        "npx vercel --prod",
      ],
    },
  ];
}

export function getGitHubCursorPrompt(tool: BuildTool, productName: string): string {
  const repo = getRepoSlug(productName);
  return `Mon produit « ${productName} » est prêt dans ${tool.name}.

Je crée le repo à la main sur github.com/new (nom : « ${repo} »). Aide-moi à pousser mon code, vérifier .gitignore/.env.example, et corriger une erreur git si le push échoue.`;
}

export function getVercelCursorPrompt(productName: string): string {
  const repo = getRepoSlug(productName);
  return `Mon projet « ${productName} » est sur GitHub (${repo}).

Je configure Vercel à la main sur vercel.com/new. Aide-moi à :
1. Lister les variables d'environnement à ajouter (Settings → Environment Variables) — alignées sur .env.example
2. Diagnostiquer si le déploiement échoue`;
}
