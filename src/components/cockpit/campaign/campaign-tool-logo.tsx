"use client";

import type { ReactNode } from "react";
import { SiClaude } from "@icons-pack/react-simple-icons";
import { BuildBrandImage } from "@/components/cockpit/build/build-brand-image";
import { ConnectorLogo } from "@/components/cockpit/integrations/connector-logo";
import {
  CAMPAIGN_TOOL_BRANDS,
  CAMPAIGN_TOOL_FALLBACK_COLORS,
} from "@/lib/campaign/brands";
import { getCampaignTool, type CampaignToolId } from "@/lib/campaign/tools";
import { cn } from "@/lib/utils";

type LogoVariant = "tile" | "inline";

const BRAND_LOGO_SURFACE =
  "bg-white ring-1 ring-black/[0.06] dark:bg-white/95 dark:ring-white/20";

const SIZE_CONFIG = {
  xs: { tile: "h-7 w-7", inner: 14, rounded: "rounded-lg" },
  sm: { tile: "h-9 w-9", inner: 18, rounded: "rounded-lg" },
  md: { tile: "h-11 w-11", inner: 22, rounded: "rounded-xl" },
  lg: { tile: "h-14 w-14", inner: 28, rounded: "rounded-xl" },
} as const;

const SIMPLE_ICON_MAP = {
  SiClaude,
} as const;

type LogoSize = keyof typeof SIZE_CONFIG;

type CampaignToolLogoProps = {
  toolId: CampaignToolId;
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
};

function LogoShell({
  children,
  size,
  variant,
  className,
}: {
  children: ReactNode;
  size: LogoSize;
  variant: LogoVariant;
  className?: string;
}) {
  const config = SIZE_CONFIG[size];

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden p-0.5",
          BRAND_LOGO_SURFACE,
          size === "xs" ? "h-5 w-5" : size === "sm" ? "h-6 w-6" : "h-7 w-7",
          config.rounded,
          className,
        )}
      >
        <span className="flex h-full w-full items-center justify-center">{children}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        "border border-border/30 shadow-sm",
        BRAND_LOGO_SURFACE,
        config.tile,
        config.rounded,
        className,
      )}
    >
      <span className="flex h-[68%] w-[68%] items-center justify-center">{children}</span>
    </span>
  );
}

export function CampaignToolLogo({
  toolId,
  size = "sm",
  variant = "tile",
  className,
}: CampaignToolLogoProps) {
  const tool = getCampaignTool(toolId);
  const brand = CAMPAIGN_TOOL_BRANDS[toolId];
  const config = SIZE_CONFIG[size];
  const label = tool?.name ?? toolId;

  const iconMarkup = (() => {
    if (!brand) {
      return (
        <span className="text-xs font-semibold text-muted-foreground">
          {label.slice(0, 2).toUpperCase()}
        </span>
      );
    }

    if (brand.source === "simple-icon") {
      const Icon = SIMPLE_ICON_MAP[brand.icon];
      if (Icon) {
        return <Icon size={config.inner} color={brand.color} aria-hidden />;
      }
    }

    if (brand.source === "favicon") {
      return (
        <BuildBrandImage
          domain={brand.domain}
          label={label}
          fallbackColor={brand.fallbackColor ?? CAMPAIGN_TOOL_FALLBACK_COLORS[toolId]}
          className="rounded-sm"
        />
      );
    }

    if (brand.source === "connector") {
      const connectorSize = size === "lg" ? "lg" : size === "xs" ? "sm" : "md";
      return (
        <ConnectorLogo
          connectorId={brand.connectorId}
          size={connectorSize}
          showTile={false}
        />
      );
    }

    return null;
  })();

  return (
    <LogoShell size={size} variant={variant} className={className}>
      {iconMarkup}
    </LogoShell>
  );
}

export function CampaignToolName({
  toolId,
  size = "sm",
}: {
  toolId: CampaignToolId;
  size?: LogoSize;
}) {
  const tool = getCampaignTool(toolId);
  return (
    <span className="inline-flex items-center gap-1.5">
      <CampaignToolLogo toolId={toolId} size={size} variant="inline" />
      <span>{tool?.name ?? toolId}</span>
    </span>
  );
}
