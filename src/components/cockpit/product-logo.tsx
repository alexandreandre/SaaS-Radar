"use client";

import { useState } from "react";
import type { ProductLogo } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const SIZE_CONFIG = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
} as const;

type ProductLogoProps = {
  logo?: ProductLogo;
  size?: keyof typeof SIZE_CONFIG;
  className?: string;
  alt?: string;
};

export function ProductLogoImage({
  logo,
  size = "md",
  className,
  alt = "Logo du produit",
}: ProductLogoProps) {
  const [visible, setVisible] = useState(true);

  if (!logo?.url || !visible) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-muted/30",
        SIZE_CONFIG[size],
        className,
      )}
    >
      <img
        src={logo.url}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setVisible(false)}
      />
    </span>
  );
}
