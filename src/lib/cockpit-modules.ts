import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  Hammer,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Plug,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { usesIdeaPlaybookModule } from "@/lib/portfolio";

export type CockpitModuleId =
  | "overview"
  | "produit"
  | "revenus"
  | "acquisition"
  | "finance"
  | "clients"
  | "rapports"
  | "playbook"
  | "build"
  | "campagne"
  | "integrations";

export type CockpitModuleDef = {
  id: CockpitModuleId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
};

export type CockpitNavGroup = {
  label: string;
  modules: CockpitModuleDef[];
};

export type ResolvedCockpitNav = {
  overview: CockpitModuleDef | null;
  projet: CockpitNavGroup;
  pilotage: CockpitNavGroup;
};

export const COCKPIT_OVERVIEW: CockpitModuleDef = {
  id: "overview",
  label: "Tableau de bord",
  shortLabel: "Tableau de bord",
  icon: LayoutDashboard,
  description: "KPIs, trajectoire MRR, alertes",
};

export const COCKPIT_PLAYBOOK: CockpitModuleDef = {
  id: "playbook",
  label: "Modèle",
  shortLabel: "Modèle",
  icon: BookOpen,
  description: "Fiche du SaaS à adapter pour la France",
};

export const COCKPIT_BUILD: CockpitModuleDef = {
  id: "build",
  label: "Build",
  shortLabel: "Build",
  icon: Hammer,
  description: "Roadmap, prompts IA, stack et suivi build",
};

export const COCKPIT_CAMPAGNE: CockpitModuleDef = {
  id: "campagne",
  label: "Campagne",
  shortLabel: "Campagne",
  icon: Megaphone,
  description: "Plan d'acquisition guidé, actions et suivi",
};

export const COCKPIT_INTEGRATIONS: CockpitModuleDef = {
  id: "integrations",
  label: "Connecteurs",
  shortLabel: "Connecteurs",
  icon: Plug,
  description: "Stripe, Qonto, CRM — alimente vos KPIs",
};

export const COCKPIT_IDEA: CockpitModuleDef = {
  id: "playbook",
  label: "Idée",
  shortLabel: "Idée",
  icon: Lightbulb,
  description: "Votre fiche projet — marché, modèle et plan",
};

/** Build, Campagne et fiche modèle / idée — ordre sidebar. */
export const COCKPIT_PROJET: CockpitNavGroup = {
  label: "Projet",
  modules: [COCKPIT_BUILD, COCKPIT_CAMPAGNE, COCKPIT_PLAYBOOK],
};

export const COCKPIT_PILOTAGE: CockpitNavGroup = {
  label: "Pilotage",
  modules: [
    COCKPIT_INTEGRATIONS,
    {
      id: "produit",
      label: "Produit",
      shortLabel: "Produit",
      icon: BarChart3,
      description: "Signups, MAU, activation",
    },
    {
      id: "revenus",
      label: "Revenus",
      shortLabel: "Revenus",
      icon: CreditCard,
      description: "MRR, ARR, rétention, historique",
    },
    {
      id: "acquisition",
      label: "Acquisition",
      shortLabel: "Acquisition",
      icon: TrendingUp,
      description: "Campagnes, ROAS, funnel",
    },
    {
      id: "finance",
      label: "Finance",
      shortLabel: "Finance",
      icon: Wallet,
      description: "Trésorerie, burn, compta FR",
    },
    {
      id: "clients",
      label: "Clients",
      shortLabel: "Clients",
      icon: Users,
      description: "Support, CRM, health score",
    },
    {
      id: "rapports",
      label: "Rapports",
      shortLabel: "Rapports",
      icon: FileText,
      description: "Rapport mensuel, export PDF",
    },
  ],
};

export const COCKPIT_NAV = {
  overview: COCKPIT_OVERVIEW,
  projet: COCKPIT_PROJET,
  pilotage: COCKPIT_PILOTAGE,
} as const;

/** Flat list for alerts, lookups, and legacy consumers. */
export const COCKPIT_MODULES: CockpitModuleDef[] = [
  COCKPIT_OVERVIEW,
  ...COCKPIT_PROJET.modules,
  ...COCKPIT_PILOTAGE.modules,
];

export const DEFAULT_COCKPIT_MODULE: CockpitModuleId = "overview";

export function getCockpitHref(projectId: string, module?: CockpitModuleId): string {
  if (!module) return `/cockpit/${projectId}`;
  return `/cockpit/${projectId}?module=${module}`;
}

export function isCockpitModuleId(value: string | null): value is CockpitModuleId {
  return COCKPIT_MODULES.some((m) => m.id === value);
}

export function getCockpitModule(id: CockpitModuleId): CockpitModuleDef {
  return COCKPIT_MODULES.find((m) => m.id === id) ?? COCKPIT_OVERVIEW;
}

export function resolveCockpitModule(
  module: CockpitModuleDef,
  opportunity?: Pick<Opportunity, "name">,
  project?: Pick<UserProject, "projectSource" | "ideaBrief">,
): CockpitModuleDef {
  if (module.id === "playbook" && project && usesIdeaPlaybookModule(project as UserProject)) {
    const name = project.ideaBrief?.identity.name ?? opportunity?.name;
    return {
      ...COCKPIT_IDEA,
      ...(name ? { label: `Idée · ${name}`, shortLabel: name } : {}),
    };
  }
  if (module.id === "playbook" && opportunity?.name) {
    return {
      ...module,
      label: `Modèle · ${opportunity.name}`,
      shortLabel: opportunity.name,
      description: "Fiche du SaaS à adapter pour la France",
    };
  }
  return module;
}

function resolveNavGroup(
  group: CockpitNavGroup,
  opportunity?: Pick<Opportunity, "name">,
  project?: Pick<UserProject, "projectSource" | "ideaBrief">,
): CockpitNavGroup {
  return {
    ...group,
    modules: group.modules.map((mod) => resolveCockpitModule(mod, opportunity, project)),
  };
}

export function resolveNavForOpportunity(
  opportunity?: Pick<Opportunity, "name">,
  allowedModules?: CockpitModuleId[],
  project?: Pick<UserProject, "projectSource" | "ideaBrief">,
): ResolvedCockpitNav {
  const filtered = filterNavGroups(allowedModules);

  return {
    overview: filtered.overview
      ? resolveCockpitModule(filtered.overview, opportunity, project)
      : null,
    projet: resolveNavGroup(filtered.projet, opportunity, project),
    pilotage: resolveNavGroup(filtered.pilotage, opportunity, project),
  };
}

export function getResolvedCockpitModule(
  id: CockpitModuleId,
  opportunity?: Pick<Opportunity, "name">,
  project?: Pick<UserProject, "projectSource" | "ideaBrief">,
): CockpitModuleDef {
  return resolveCockpitModule(getCockpitModule(id), opportunity, project);
}

/** Map legacy tab IDs to new module IDs. */
export function normalizeModuleId(tab: string): CockpitModuleId {
  const legacy: Record<string, CockpitModuleId> = {
    budget: "finance",
    journal: "build",
  };
  const mapped = legacy[tab] ?? tab;
  return isCockpitModuleId(mapped) ? mapped : DEFAULT_COCKPIT_MODULE;
}

export function filterNavGroups(allowedModules?: CockpitModuleId[]): ResolvedCockpitNav {
  const filterGroup = (group: CockpitNavGroup) => ({
    ...group,
    modules: allowedModules
      ? group.modules.filter((m) => allowedModules.includes(m.id))
      : group.modules,
  });

  if (!allowedModules) {
    return COCKPIT_NAV;
  }

  return {
    overview: allowedModules.includes("overview") ? COCKPIT_OVERVIEW : null,
    projet: filterGroup(COCKPIT_PROJET),
    pilotage: filterGroup(COCKPIT_PILOTAGE),
  };
}
