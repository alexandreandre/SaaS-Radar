import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  Hammer,
  LayoutDashboard,
  Megaphone,
  Plug,
  Users,
  Wallet,
} from "lucide-react";
import type { Opportunity } from "@/types/opportunity";

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

export const COCKPIT_INTEGRATIONS: CockpitModuleDef = {
  id: "integrations",
  label: "Connecteurs",
  shortLabel: "Connecteurs",
  icon: Plug,
  description: "Stripe, Qonto, CRM — alimente vos KPIs",
};

/** Build et fiche modèle — ordre sidebar. */
export const COCKPIT_PROJET: CockpitNavGroup = {
  label: "Projet",
  modules: [COCKPIT_BUILD, COCKPIT_PLAYBOOK],
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
      icon: Megaphone,
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
): CockpitModuleDef {
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
): CockpitNavGroup {
  return {
    ...group,
    modules: group.modules.map((mod) => resolveCockpitModule(mod, opportunity)),
  };
}

export function resolveNavForOpportunity(
  opportunity?: Pick<Opportunity, "name">,
  allowedModules?: CockpitModuleId[],
): ResolvedCockpitNav {
  const filtered = filterNavGroups(allowedModules);

  return {
    overview: filtered.overview
      ? resolveCockpitModule(filtered.overview, opportunity)
      : null,
    projet: resolveNavGroup(filtered.projet, opportunity),
    pilotage: resolveNavGroup(filtered.pilotage, opportunity),
  };
}

export function getResolvedCockpitModule(
  id: CockpitModuleId,
  opportunity?: Pick<Opportunity, "name">,
): CockpitModuleDef {
  return resolveCockpitModule(getCockpitModule(id), opportunity);
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
