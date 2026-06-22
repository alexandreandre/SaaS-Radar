import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  Globe2,
  HelpCircle,
  Mail,
  Newspaper,
  Rocket,
  Sparkles,
  Calculator,
} from "lucide-react";
import { MAP_EXPLORE_HREF } from "@/lib/map-routes";
import { isDiscoveryPhase, isCockpitEnabled } from "@/lib/product-phase";

export type NavLinkItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  mapExplore?: boolean;
  /** Masqué en phase discovery (ex. tarifs). */
  discoveryHidden?: boolean;
  /** Visible uniquement si cockpit actif (full ou admin). */
  requiresCockpit?: boolean;
  /** Affiché dans la barre du bas mobile. */
  bottomNav?: boolean;
};

export const NAV_LINKS: NavLinkItem[] = [
  {
    href: MAP_EXPLORE_HREF,
    label: "Carte du monde",
    shortLabel: "Carte",
    icon: Globe2,
    mapExplore: true,
    bottomNav: true,
  },
  {
    href: "/opportunities",
    label: "Opportunités",
    shortLabel: "Opportunités",
    icon: Sparkles,
    bottomNav: true,
  },
  {
    href: "/newsletter",
    label: "Newsletter",
    shortLabel: "Newsletter",
    icon: Mail,
    bottomNav: true,
  },
  {
    href: "/quiz",
    label: "Quel SaaS pour moi ?",
    shortLabel: "Quiz",
    icon: HelpCircle,
  },
  {
    href: "/pricing",
    label: "Tarifs",
    shortLabel: "Tarifs",
    icon: CreditCard,
    discoveryHidden: true,
  },
  {
    href: "/weekly",
    label: "Pick hebdo",
    shortLabel: "Hebdo",
    icon: Newspaper,
  },
  {
    href: "/simulator",
    label: "Simulateur",
    shortLabel: "Simulateur",
    icon: Calculator,
  },
  {
    href: "/mes-saas",
    label: "Mes SaaS",
    shortLabel: "Mes SaaS",
    icon: Rocket,
    requiresCockpit: true,
  },
];

export type NavContext = {
  discovery?: boolean;
  cockpitOn?: boolean;
  isAdmin?: boolean;
};

export function resolveNavLinks(ctx: NavContext = {}): NavLinkItem[] {
  const discovery = ctx.discovery ?? isDiscoveryPhase();
  const cockpitOn = ctx.cockpitOn ?? isCockpitEnabled(ctx.isAdmin ?? false);

  return NAV_LINKS.filter((link) => {
    if (discovery && link.discoveryHidden) return false;
    if (link.requiresCockpit && !cockpitOn) return false;
    return true;
  });
}

export function getBottomNavLinks(ctx: NavContext = {}): NavLinkItem[] {
  return resolveNavLinks(ctx).filter((link) => link.bottomNav);
}

/** Routes sans barre du bas (carte plein écran, admin, cockpit). */
export function shouldHideMobileBottomNav(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/cockpit/")) return true;
  return false;
}

/** Ancre hero pour masquer le chrome flottant au scroll. */
export function getFloatingNavHideAnchor(pathname: string): string | null {
  if (pathname === "/") return "home-hero";
  if (pathname === "/opportunities") return "opportunities-hero";
  return null;
}
