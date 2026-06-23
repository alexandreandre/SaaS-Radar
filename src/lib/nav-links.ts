export type NavIconId = "sparkles" | "mail" | "help";

export type NavLinkItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: NavIconId;
  /** Affiché dans la barre du bas mobile. */
  bottomNav?: boolean;
};

export const NAV_LINKS: NavLinkItem[] = [
  {
    href: "/opportunities",
    label: "Opportunités",
    shortLabel: "Opportunités",
    icon: "sparkles",
    bottomNav: true,
  },
  {
    href: "/newsletter",
    label: "Newsletter",
    shortLabel: "Newsletter",
    icon: "mail",
    bottomNav: true,
  },
  {
    href: "/quiz",
    label: "Quel SaaS pour moi ?",
    shortLabel: "Quiz",
    icon: "help",
  },
];

export function resolveNavLinks(): NavLinkItem[] {
  return NAV_LINKS;
}

export type DiscoveryChromeVariant = "floating-scroll" | "sticky-compact";

/** Pages discovery avec chrome mobile (sans bottom nav). */
export function getDiscoveryChromeVariant(pathname: string): DiscoveryChromeVariant | null {
  if (pathname === "/" || pathname === "/opportunities") return "floating-scroll";
  if (
    pathname.startsWith("/opportunities/") ||
    pathname.startsWith("/newsletter") ||
    pathname === "/quiz" ||
    pathname === "/login" ||
    pathname === "/bientot"
  ) {
    return "sticky-compact";
  }
  return null;
}

/** Ancre hero pour masquer le chrome flottant discovery au scroll. */
export function getDiscoveryChromeHideAnchor(pathname: string): string | null {
  if (pathname === "/") return "home-hero";
  if (pathname === "/opportunities") return "opportunities-hero";
  return null;
}

/** CTA contextuel du chrome discovery (secondaire, jamais de bottom nav). */
export function getDiscoveryContextualCta(
  pathname: string,
): { href: string; label: string } | null {
  if (pathname === "/") return { href: "/opportunities", label: "Opportunités" };
  if (pathname === "/opportunities") return { href: "/", label: "Accueil" };
  if (pathname.startsWith("/opportunities/")) return { href: "/opportunities", label: "Liste" };
  if (pathname.startsWith("/newsletter") || pathname === "/quiz" || pathname === "/bientot") {
    return { href: "/opportunities", label: "Opportunités" };
  }
  if (pathname === "/login") return { href: "/", label: "Accueil" };
  return null;
}

export function getBottomNavLinks(): NavLinkItem[] {
  return resolveNavLinks().filter((link) => link.bottomNav);
}

/** Routes sans barre du bas (carte plein écran, admin, cockpit). */
export function shouldHideMobileBottomNav(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/cockpit/")) return true;
  return false;
}

