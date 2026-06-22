"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useChromeVisible(anchorId?: string | null) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!anchorId) {
      setVisible(true);
      return;
    }

    const anchor = document.getElementById(anchorId);
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorId]);

  return visible;
}

type DiscoveryFloatingNavProps = {
  dark?: boolean;
  /** Masque logo + actions quand l’ancre n’est plus visible au scroll */
  hideAnchorId?: string | null;
};

export function DiscoveryFloatingNav({
  dark = false,
  hideAnchorId = null,
}: DiscoveryFloatingNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const chromeVisible = useChromeVisible(hideAnchorId);
  const hideChrome = Boolean(hideAnchorId && !chromeVisible);
  const isOpportunityDetail = /^\/opportunities\/[^/]+$/.test(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chrome = (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] px-4 pt-4 transition-opacity duration-300 sm:px-6 sm:pt-5",
        hideChrome && "opacity-0",
        dark && "text-hero-foreground",
      )}
      aria-hidden={hideChrome}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className={cn("pointer-events-auto", hideChrome && "pointer-events-none")}>
          <BrandLogo
            dark={dark}
            markClassName="h-10 sm:h-11"
            textClassName="text-base sm:text-lg"
          />
        </div>
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-2",
            hideChrome && "pointer-events-none",
          )}
        >
          {!isOpportunityDetail ? (
            <Button
              size="sm"
              className={cn(
                !dark && "shadow-sm",
                dark &&
                  "border-hero-foreground/20 bg-hero-foreground/10 text-hero-foreground backdrop-blur-sm hover:bg-hero-foreground/20",
              )}
              variant={dark ? "outline" : "default"}
              asChild
            >
              <Link href="/opportunities">Opportunités</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(chrome, document.body);
}
