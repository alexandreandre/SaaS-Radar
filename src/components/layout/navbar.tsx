"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { LogOut, Menu, Rocket, Shield } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useChromeVisible } from "@/components/layout/use-chrome-visible";
import { useOptionalPortfolio } from "@/contexts/portfolio-context";
import { usePortfolioSummary } from "@/hooks/use-portfolio-summary";
import { useSession } from "@/contexts/session-context";
import { MAP_EXPLORE_HREF, MAP_EXPLORE_QUERY } from "@/lib/map-routes";
import { prefetchAllAdminRoutes } from "@/lib/admin/route-prefetch";
import { isCockpitEnabled, isDiscoveryPhase } from "@/lib/product-phase";
import {
  getDiscoveryChromeHideAnchor,
  getDiscoveryChromeVariant,
  getDiscoveryContextualCta,
  resolveNavLinks,
} from "@/lib/nav-links";

const MobileNavChrome = dynamic(
  () =>
    import("@/components/layout/mobile-nav-chrome").then((m) => ({
      default: m.MobileNavChrome,
    })),
  { ssr: false },
);

function NavbarContent({
  dark = false,
  explore,
}: {
  dark?: boolean;
  explore?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const portfolio = useOptionalPortfolio();
  const summary = usePortfolioSummary(!portfolio);
  const overdueCheckIns = portfolio?.hydrated
    ? portfolio.overdueCheckIns
    : summary.hydrated
      ? summary.overdueCheckIns
      : 0;
  const portfolioHydrated = portfolio?.hydrated ?? summary.hydrated;
  const { isAuthenticated, isAdmin, hasAdminGate } = useSession();
  const discovery = isDiscoveryPhase();
  const cockpitOn = isCockpitEnabled(isAdmin);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const discoveryVariant = discovery ? getDiscoveryChromeVariant(pathname) : null;
  const hideAnchorId = getDiscoveryChromeHideAnchor(pathname);
  const chromeVisible = useChromeVisible(hideAnchorId);
  const hideChrome = Boolean(hideAnchorId && !chromeVisible);
  const pinDiscoveryLogo = pathname === "/opportunities";
  const discoveryCta = discovery ? getDiscoveryContextualCta(pathname) : null;

  const links = useMemo(() => resolveNavLinks(), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isAdmin && hasAdminGate) {
      router.prefetch("/admin");
      prefetchAllAdminRoutes();
    }
  }, [isAdmin, hasAdminGate, router]);

  useEffect(() => {
    if (isAuthenticated && cockpitOn) {
      router.prefetch("/mes-saas");
    }
  }, [isAuthenticated, cockpitOn, router]);

  const ghostBtnClass = cn(
    dark
      ? "border-hero-foreground/15 bg-transparent text-hero-foreground hover:bg-hero-foreground/10"
      : "",
  );

  if (discovery) {
    if (!discoveryVariant) return null;

    if (discoveryVariant === "sticky-compact") {
      return (
        <header
          className={cn(
            "sticky top-0 z-50 border-b backdrop-blur-md pt-[max(0px,env(safe-area-inset-top))]",
            dark ? "border-hero-foreground/10 bg-hero/85" : "border-border bg-background/90",
          )}
        >
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
            <BrandLogo dark={dark} />
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle dark={dark} />
              {discoveryCta ? (
                <Button size="sm" className="min-h-10 shrink-0" asChild>
                  <Link href={discoveryCta.href}>{discoveryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </header>
      );
    }

    const floatingChrome = (
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[100] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-300 sm:px-6",
          !pinDiscoveryLogo && hideChrome && "opacity-0",
          dark && "text-hero-foreground",
        )}
        aria-hidden={!pinDiscoveryLogo && hideChrome}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div
            className={cn(
              "pointer-events-auto min-w-0",
              !pinDiscoveryLogo && hideChrome && "pointer-events-none",
            )}
          >
            <BrandLogo
              dark={dark}
              markClassName="h-10 sm:h-11"
              textClassName="text-base sm:text-lg"
            />
          </div>
          <div
            className={cn(
              "pointer-events-auto flex shrink-0 items-center gap-2 transition-opacity duration-300",
              hideChrome && "pointer-events-none opacity-0",
            )}
          >
            <ThemeToggle
              dark={dark}
              className={cn(
                "h-9 w-9 shrink-0 border-border/40 bg-background/55 shadow-none backdrop-blur-sm",
                dark &&
                  "border-hero-foreground/15 bg-hero-foreground/10 text-map-muted hover:text-hero-foreground",
              )}
            />
            {discoveryCta ? (
              <Button
                size="sm"
                className={cn(
                  "min-h-10",
                  !dark && "shadow-sm",
                  dark &&
                    "border-hero-foreground/20 bg-hero-foreground/10 text-hero-foreground backdrop-blur-sm hover:bg-hero-foreground/20",
                )}
                variant={dark ? "outline" : "default"}
                asChild
              >
                <Link href={discoveryCta.href}>{discoveryCta.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );

    return mounted ? createPortal(floatingChrome, document.body) : null;
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b backdrop-blur-md",
          dark ? "border-hero-foreground/10 bg-hero/85" : "border-border bg-background/85",
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <BrandLogo dark={dark} />
          <nav className="hidden items-center gap-7 md:flex" aria-label="Sections">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                    dark
                      ? active
                        ? "text-hero-foreground"
                        : "text-map-muted hover:text-hero-foreground"
                      : active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle dark={dark} />
            {isAuthenticated ? (
              <>
                {isAdmin ? (
                  <Button
                    variant={dark ? "outline" : "ghost"}
                    size="sm"
                    className={cn("hidden min-h-10 sm:inline-flex", ghostBtnClass)}
                    asChild
                  >
                    <Link href="/admin" prefetch>
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  </Button>
                ) : null}
                {cockpitOn ? (
                  <Button
                    variant={dark ? "outline" : "ghost"}
                    size="sm"
                    className={cn("relative hidden min-h-10 sm:inline-flex", ghostBtnClass)}
                    asChild
                  >
                    <Link href="/mes-saas" prefetch>
                      <Rocket className="h-4 w-4" />
                      Mes SaaS
                      {portfolioHydrated && overdueCheckIns > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-background" />
                      ) : null}
                    </Link>
                  </Button>
                ) : null}
                <form action="/auth/signout" method="post" className="hidden sm:block">
                  <Button
                    type="submit"
                    variant={dark ? "outline" : "ghost"}
                    size="sm"
                    aria-label="Se déconnecter"
                    className={ghostBtnClass}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <Button
                variant={dark ? "outline" : "ghost"}
                size="sm"
                className={cn("hidden min-h-10 sm:inline-flex", ghostBtnClass)}
                asChild
              >
                <Link href="/login">Connexion</Link>
              </Button>
            )}
            <Button size="sm" className="hidden min-h-10 md:inline-flex" asChild>
              <Link href={MAP_EXPLORE_HREF}>Explorer</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={dark ? "outline" : "ghost"}
              className={cn("min-h-11 min-w-11 px-0 md:hidden", ghostBtnClass)}
              aria-label="Ouvrir le menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </div>
        </div>
      </header>
      <MobileNavChrome
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
        explore={explore}
        dark={dark}
      />
    </>
  );
}

function NavbarWithSearchParams(props: { dark?: boolean }) {
  const explore = useSearchParams().get(MAP_EXPLORE_QUERY);
  return <NavbarContent {...props} explore={explore} />;
}

export function Navbar(props: { dark?: boolean }) {
  return (
    <Suspense fallback={null}>
      <NavbarWithSearchParams {...props} />
    </Suspense>
  );
}
