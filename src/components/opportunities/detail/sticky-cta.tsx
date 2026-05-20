"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTier } from "@/contexts/tier-context";
import { UnlockCta } from "@/components/billing/unlock-cta";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export function StickyCta() {
  const { tier } = useTier();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show || tier !== "free") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-4 py-4 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-4">
        <Lock className="h-7 w-7 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug">
          Étapes 4 à 7 réservées aux abonnés
        </p>
        <div className="flex shrink-0 flex-col gap-2">
          <UnlockCta requiredTier="builder" size="sm" label="Builder 29€" />
          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <Link href="/dashboard">Tarifs</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
