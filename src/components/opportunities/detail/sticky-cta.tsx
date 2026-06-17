"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTier } from "@/contexts/tier-context";
import { Button } from "@/components/ui/button";
import { tierPrices } from "@/lib/tier";
import { Lock } from "lucide-react";

export function StickyCta() {
  const { tier } = useTier();
  const [show, setShow] = useState(false);
  const [paywallInView, setPaywallInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const paywall = document.getElementById("paywall");
    if (!paywall) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPaywallInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(paywall);
    return () => observer.disconnect();
  }, []);

  if (!show || paywallInView || tier !== "free") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
        <p className="min-w-0 flex-1 text-sm font-medium text-foreground/90">Suite réservée aux abonnés</p>
        <Button size="sm" className="shrink-0 font-semibold" asChild>
          <Link href="/mes-saas">Débloquer — {tierPrices.builder}</Link>
        </Button>
      </div>
    </div>
  );
}
