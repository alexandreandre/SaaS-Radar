"use client";

import { useEffect, useState } from "react";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function StickySubscribeBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div
      className={cn(
        "mobile-sticky-above-nav fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 py-2.5 backdrop-blur-md"
      )}
      role="region"
      aria-label="S'abonner"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4">
        <p className="hidden text-sm text-muted-foreground sm:block">Flash du matin · gratuit</p>
        <SubscribeForm variant="compact" buttonLabel="S'abonner" className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
