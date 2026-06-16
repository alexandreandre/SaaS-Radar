"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/contexts/favorites-context";

type FavoriteButtonProps = {
  slug: string;
  size?: "sm" | "md";
  variant?: "icon" | "pill";
  className?: string;
  /** Empêche la navigation quand le bouton est dans un lien cliquable. */
  stopNavigation?: boolean;
};

export function FavoriteButton({
  slug,
  size = "md",
  variant = "icon",
  className,
  stopNavigation = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, togglingSlug, hydrated } = useFavorites();
  const active = isFavorite(slug);
  const loading = togglingSlug === slug;

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const label = active ? "En favori" : "Ajouter aux favoris";
  const shortLabel = active ? "Favori" : "Favoris";

  return (
    <button
      type="button"
      disabled={!hydrated || loading}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      title={label}
      onClick={(e) => {
        if (stopNavigation) {
          e.preventDefault();
          e.stopPropagation();
        }
        void toggleFavorite(slug);
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "icon" && [
          "rounded-full",
          size === "sm" ? "h-9 w-9" : "h-10 w-10",
        ],
        variant === "pill" && [
          "rounded-full font-medium shadow-sm",
          size === "sm" ? "gap-1.5 px-3 py-1.5 text-xs" : "gap-2 px-4 py-2 text-sm",
        ],
        active
          ? "border-primary/50 bg-primary/15 text-primary hover:bg-primary/20"
          : variant === "pill"
            ? "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
        loading && "opacity-60",
        className
      )}
    >
      <Heart
        className={cn(iconSize, active && "fill-current", active && "scale-110")}
        aria-hidden
      />
      {variant === "pill" && (
        <span className="whitespace-nowrap">{size === "sm" ? shortLabel : label}</span>
      )}
    </button>
  );
}
