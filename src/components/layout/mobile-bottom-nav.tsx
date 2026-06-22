"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBottomNavLinks,
  shouldHideMobileBottomNav,
  type NavLinkItem,
} from "@/lib/nav-links";
import { isMapExploreActive } from "@/lib/map-routes";
import { isCockpitEnabled, isDiscoveryPhase } from "@/lib/product-phase";
import { useSession } from "@/contexts/session-context";

type MobileBottomNavProps = {
  onOpenMenu: () => void;
  explore?: string | null;
};

function NavItem({
  link,
  pathname,
  explore,
}: {
  link: NavLinkItem;
  pathname: string;
  explore: string | null;
}) {
  const Icon = link.icon;
  const isActive = link.mapExplore
    ? isMapExploreActive(pathname, explore)
    : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <Link
      href={link.href}
      className={cn(
        "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium leading-none transition-colors active:opacity-70",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
      <span className="truncate">{link.shortLabel}</span>
    </Link>
  );
}

export function MobileBottomNav({ onOpenMenu, explore = null }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { isAdmin } = useSession();
  const [mounted, setMounted] = useState(false);

  const links = useMemo(
    () =>
      getBottomNavLinks({
        discovery: isDiscoveryPhase(),
        cockpitOn: isCockpitEnabled(isAdmin),
        isAdmin,
      }),
    [isAdmin],
  );

  const hidden = shouldHideMobileBottomNav(pathname);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.classList.toggle("has-mobile-bottom-nav", mounted && !hidden);
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, [mounted, hidden]);

  if (!mounted || hidden) return null;

  return createPortal(
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md md:hidden mobile-bottom-nav"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {links.map((link) => (
          <NavItem
            key={link.href}
            link={link}
            pathname={pathname}
            explore={explore}
          />
        ))}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium leading-none text-muted-foreground transition-colors active:opacity-70"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5 shrink-0" aria-hidden />
          <span>Menu</span>
        </button>
      </div>
    </nav>,
    document.body,
  );
}
