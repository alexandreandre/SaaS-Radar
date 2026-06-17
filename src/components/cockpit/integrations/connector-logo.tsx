"use client";

import { getConnector } from "@/lib/connectors/registry";
import type { ConnectorId } from "@/lib/connectors/types";
import { cn } from "@/lib/utils";
import { SIMPLE_BRAND_ICONS } from "@/components/cockpit/integrations/connector-brand-icons";
import { LOCAL_BRAND_ICONS } from "@/components/cockpit/integrations/connector-local-icons";

const SIZE_CONFIG = {
  sm: { tile: "h-8 w-8", icon: 18, rounded: "rounded-lg" },
  md: { tile: "h-11 w-11", icon: 28, rounded: "rounded-xl" },
  lg: { tile: "h-14 w-14", icon: 36, rounded: "rounded-xl" },
} as const;

function connectorMonogram(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

type ConnectorLogoProps = {
  connectorId: ConnectorId;
  size?: keyof typeof SIZE_CONFIG;
  showRing?: boolean;
  showTile?: boolean;
  className?: string;
  decorative?: boolean;
};

export function ConnectorLogo({
  connectorId,
  size = "md",
  showRing = false,
  showTile = true,
  className,
  decorative = true,
}: ConnectorLogoProps) {
  const connector = getConnector(connectorId);
  const config = SIZE_CONFIG[size];
  const brand = connector?.brand;
  const name = connector?.name ?? connectorId;

  const iconMarkup = (() => {
    if (!brand) {
      return (
        <span className="text-xs font-semibold text-muted-foreground">
          {connectorMonogram(name)}
        </span>
      );
    }

    if (brand.source === "simple-icons") {
      const Icon = SIMPLE_BRAND_ICONS[brand.icon];
      if (Icon) {
        return (
          <Icon
            size={config.icon}
            color={brand.color}
            aria-hidden={decorative}
            title={decorative ? undefined : name}
          />
        );
      }
    }

    if (brand.source === "local") {
      const LocalIcon = LOCAL_BRAND_ICONS[brand.icon];
      if (LocalIcon) {
        return (
          <LocalIcon
            size={config.icon}
            color={brand.color}
            aria-hidden={decorative}
          />
        );
      }
    }

    return (
      <span
        className="text-xs font-semibold"
        style={{ color: brand.color }}
        aria-hidden={decorative}
      >
        {connectorMonogram(name)}
      </span>
    );
  })();

  if (!showTile) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 ring-1 ring-black/[0.06] dark:bg-white/95 dark:ring-white/20",
          size === "sm" ? "h-6 w-6" : size === "lg" ? "h-8 w-8" : "h-7 w-7",
          className,
        )}
      >
        {iconMarkup}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border border-border/30 bg-white p-1.5 ring-1 ring-black/[0.06] dark:bg-white/95 dark:ring-white/20",
        config.tile,
        config.rounded,
        showRing && "ring-2 ring-emerald-500/50 ring-offset-1 ring-offset-card",
        className
      )}
    >
      {iconMarkup}
    </span>
  );
}
