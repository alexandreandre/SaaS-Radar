"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Rocket, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { resolveNavLinks, type NavLinkItem } from "@/lib/nav-links";
import { getNavLinkIcon } from "@/lib/nav-link-icons";
import { isMapExploreActive, MAP_EXPLORE_HREF } from "@/lib/map-routes";
import { isCockpitEnabled, isDiscoveryPhase } from "@/lib/product-phase";
import { useSession } from "@/contexts/session-context";
import { useOptionalPortfolio } from "@/contexts/portfolio-context";
import { usePortfolioSummary } from "@/hooks/use-portfolio-summary";

type MobileNavDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explore?: string | null;
  dark?: boolean;
};

function DrawerLink({
  link,
  pathname,
  explore,
  onNavigate,
}: {
  link: NavLinkItem;
  pathname: string;
  explore?: string | null;
  onNavigate: () => void;
}) {
  const Icon = getNavLinkIcon(link.icon);
  const active = link.mapExplore
    ? isMapExploreActive(pathname, explore)
    : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base transition-colors active:bg-muted/80",
        active ? "bg-muted font-medium text-foreground" : "text-foreground/90",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      {link.label}
    </Link>
  );
}

export function MobileNavDrawer({
  open,
  onOpenChange,
  explore = null,
  dark = false,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useSession();
  const portfolio = useOptionalPortfolio();
  const summary = usePortfolioSummary(!portfolio);
  const overdueCheckIns = portfolio?.hydrated
    ? portfolio.overdueCheckIns
    : summary.hydrated
      ? summary.overdueCheckIns
      : 0;
  const portfolioHydrated = portfolio?.hydrated ?? summary.hydrated;
  const discovery = isDiscoveryPhase();
  const cockpitOn = isCockpitEnabled(isAdmin);

  const links = resolveNavLinks({ discovery, cockpitOn, isAdmin });
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "fixed inset-x-0 bottom-0 top-auto max-h-[min(88dvh,640px)] w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:hidden",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "[&>button.absolute]:right-3 [&>button.absolute]:top-3 [&>button.absolute]:min-h-11 [&>button.absolute]:min-w-11",
        )}
      >
        <DialogHeader className="border-b border-border px-4 py-4 text-left">
          <DialogTitle className="font-display text-lg">Navigation</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(min(88dvh,640px)-8rem)] overflow-y-auto overscroll-contain px-3 py-2">
          <nav className="flex flex-col gap-0.5" aria-label="Sections">
            {links.map((link) => (
              <DrawerLink
                key={link.href}
                link={link}
                pathname={pathname}
                explore={explore}
                onNavigate={close}
              />
            ))}
          </nav>

          <div className="my-3 border-t border-border" />

          <div className="flex flex-col gap-1 pb-2">
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={close}
                    className="flex min-h-12 items-center gap-3 rounded-lg px-3 text-base active:bg-muted/80"
                  >
                    <Shield className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    Admin
                  </Link>
                ) : null}
                {cockpitOn ? (
                  <Link
                    href="/mes-saas"
                    onClick={close}
                    className="relative flex min-h-12 items-center gap-3 rounded-lg px-3 text-base active:bg-muted/80"
                  >
                    <Rocket className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    Mes SaaS
                    {portfolioHydrated && overdueCheckIns > 0 ? (
                      <span className="ml-auto h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                    ) : null}
                  </Link>
                ) : null}
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-base text-left active:bg-muted/80"
                  >
                    <LogOut className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    Se déconnecter
                  </button>
                </form>
              </>
            ) : (
              <Button variant="outline" className="min-h-11 w-full" asChild onClick={close}>
                <Link href="/login">Connexion</Link>
              </Button>
            )}

            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">Thème</span>
              <ThemeToggle dark={dark} />
            </div>
          </div>
        </div>

        <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button className="min-h-11 w-full" asChild onClick={close}>
            <Link href={MAP_EXPLORE_HREF}>Explorer la carte</Link>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
