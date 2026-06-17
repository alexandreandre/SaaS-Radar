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

export const COCKPIT_OVERVIEW: CockpitModuleDef = {
  id: "overview",
  label: "Vue d'ensemble",
  shortLabel: "Overview",
  icon: LayoutDashboard,
  description: "KPIs, trajectoire MRR, alertes",
};

export const COCKPIT_PILOTAGE: CockpitNavGroup = {
  label: "Pilotage",
  modules: [
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

export const COCKPIT_RESSOURCES: CockpitNavGroup = {
  label: "Ressources",
  modules: [
    {
      id: "playbook",
      label: "Playbook",
      shortLabel: "Playbook",
      icon: BookOpen,
      description: "Recherche, guide MVP, finances, acquisition",
    },
    {
      id: "build",
      label: "Build",
      shortLabel: "Build",
      icon: Hammer,
      description: "Roadmap, prompts IA, stack et suivi build",
    },
    {
      id: "integrations",
      label: "Connecteurs",
      shortLabel: "Connecteurs",
      icon: Plug,
      description: "Marketplace connecteurs",
    },
  ],
};

export const COCKPIT_NAV = {
  overview: COCKPIT_OVERVIEW,
  pilotage: COCKPIT_PILOTAGE,
  ressources: COCKPIT_RESSOURCES,
} as const;

/** Flat list for alerts, lookups, and legacy consumers. */
export const COCKPIT_MODULES: CockpitModuleDef[] = [
  COCKPIT_OVERVIEW,
  ...COCKPIT_PILOTAGE.modules,
  ...COCKPIT_RESSOURCES.modules,
];

export const DEFAULT_COCKPIT_MODULE: CockpitModuleId = "overview";

export function isCockpitModuleId(value: string | null): value is CockpitModuleId {
  return COCKPIT_MODULES.some((m) => m.id === value);
}

export function getCockpitModule(id: CockpitModuleId): CockpitModuleDef {
  return COCKPIT_MODULES.find((m) => m.id === id) ?? COCKPIT_OVERVIEW;
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

export function filterNavGroups(allowedModules?: CockpitModuleId[]) {
  if (!allowedModules) {
    return COCKPIT_NAV;
  }

  const filterGroup = (group: CockpitNavGroup) => ({
    ...group,
    modules: group.modules.filter((m) => allowedModules.includes(m.id)),
  });

  return {
    overview: allowedModules.includes("overview") ? COCKPIT_OVERVIEW : null,
    pilotage: filterGroup(COCKPIT_PILOTAGE),
    ressources: filterGroup(COCKPIT_RESSOURCES),
  };
}
