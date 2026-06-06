import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
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
  | "revenus"
  | "acquisition"
  | "produit"
  | "finance"
  | "clients"
  | "build"
  | "integrations"
  | "rapports";

export type CockpitModuleDef = {
  id: CockpitModuleId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
};

export const COCKPIT_MODULES: CockpitModuleDef[] = [
  {
    id: "overview",
    label: "Vue d'ensemble",
    shortLabel: "Overview",
    icon: LayoutDashboard,
    description: "KPIs, promesse vs réalité, alertes",
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
    id: "produit",
    label: "Produit",
    shortLabel: "Produit",
    icon: BarChart3,
    description: "Signups, MAU, activation",
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
    id: "build",
    label: "Build & Ship",
    shortLabel: "Build",
    icon: Hammer,
    description: "Journal, GitHub, Sentry",
  },
  {
    id: "integrations",
    label: "Intégrations",
    shortLabel: "Intégrations",
    icon: Plug,
    description: "Marketplace connecteurs",
  },
  {
    id: "rapports",
    label: "Rapports",
    shortLabel: "Rapports",
    icon: FileText,
    description: "Rapport mensuel, export PDF",
  },
];

export const DEFAULT_COCKPIT_MODULE: CockpitModuleId = "overview";

export function isCockpitModuleId(value: string | null): value is CockpitModuleId {
  return COCKPIT_MODULES.some((m) => m.id === value);
}

export function getCockpitModule(id: CockpitModuleId): CockpitModuleDef {
  return COCKPIT_MODULES.find((m) => m.id === id) ?? COCKPIT_MODULES[0];
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
