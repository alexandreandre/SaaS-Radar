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

export type NavContext = {
  discovery?: boolean;
};

export function resolveNavLinks(_ctx: NavContext = {}): NavLinkItem[] {
  return NAV_LINKS;
}

/** Ancre hero pour masquer le chrome discovery au scroll. */
export function getDiscoveryChromeHideAnchor(pathname: string): string | null {
  if (pathname === "/") return "home-hero";
  if (pathname === "/opportunities") return "opportunities-hero";
  return null;
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

