"use client";

import { cn } from "@/lib/utils";

/** Placeholder discret — le hero affiche déjà le radar-grid en arrière-plan. */
export function MapHeroSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute inset-0 bg-background", className)}
      aria-hidden
    />
  );
}
