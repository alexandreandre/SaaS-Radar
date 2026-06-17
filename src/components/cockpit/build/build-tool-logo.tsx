"use client";

import type { ReactNode } from "react";
import {
  SiAnthropic,
  SiCursor,
  SiReplit,
  SiSupabase,
  SiV0,
  SiWindsurf,
} from "@icons-pack/react-simple-icons";
import { ConnectorLogo } from "@/components/cockpit/integrations/connector-logo";
import { BuildBrandImage } from "@/components/cockpit/build/build-brand-image";
import {
  BUILD_PLATFORM_BRANDS,
  BUILD_TOOL_BRANDS,
  INFRA_BRANDS,
  matchInfraBrand,
  type BuildPlatformId,
  type InfraBrandId,
} from "@/lib/build/brands";
import { getBuildTool, type BuildTool, type BuildToolId } from "@/lib/build/tools";
import { cn } from "@/lib/utils";

type LogoVariant = "tile" | "inline";

/** Surface claire pour garder les logos lisibles en mode sombre. */
const BRAND_LOGO_SURFACE =
  "bg-white ring-1 ring-black/[0.06] dark:bg-white/95 dark:ring-white/20";

const SIZE_CONFIG = {
  xs: { tile: "h-7 w-7", inner: 14, rounded: "rounded-lg" },
  sm: { tile: "h-9 w-9", inner: 18, rounded: "rounded-lg" },
  md: { tile: "h-11 w-11", inner: 22, rounded: "rounded-xl" },
  lg: { tile: "h-14 w-14", inner: 28, rounded: "rounded-xl" },
} as const;

const SIMPLE_ICON_MAP = {
  SiV0,
  SiReplit,
  SiCursor,
  SiAnthropic,
  SiWindsurf,
  SiSupabase,
} as const;

const INFRA_LABELS: Record<InfraBrandId, string> = {
  supabase: "Supabase",
  firebase: "Firebase",
  stripe: "Stripe",
  resend: "Resend",
  openai: "OpenAI",
};

const FAVICON_FALLBACK_COLORS: Partial<Record<BuildToolId, string>> = {
  base44: "#4F46E5",
  lovable: "#FF385C",
  bolt: "#FBBF24",
};

type LogoSize = keyof typeof SIZE_CONFIG;

type BuildToolLogoProps = {
  toolId: BuildToolId;
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

export function BuildToolLogo({
  toolId,
  size = "sm",
  variant = "tile",
  className,
}: BuildToolLogoProps) {
  const tool = getBuildTool(toolId);
  const brand = BUILD_TOOL_BRANDS[toolId];
  const config = SIZE_CONFIG[size];
  const label = tool?.name ?? toolId;

  const iconMarkup = (() => {
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
          fallbackColor={FAVICON_FALLBACK_COLORS[toolId]}
          className="rounded-sm"
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

type BuildPlatformLogoProps = {
  platform: BuildPlatformId;
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
};

export function BuildPlatformLogo({
  platform,
  size = "sm",
  variant = "tile",
  className,
}: BuildPlatformLogoProps) {
  const brand = BUILD_PLATFORM_BRANDS[platform];

  if (brand.source === "connector") {
    const connectorSize = size === "lg" ? "lg" : size === "xs" ? "sm" : "md";
    if (variant === "inline") {
      return (
        <ConnectorLogo
          connectorId={brand.connectorId}
          size={connectorSize}
          showTile={false}
          className={className}
        />
      );
    }
    return (
      <ConnectorLogo
        connectorId={brand.connectorId}
        size={connectorSize}
        showTile
        className={className}
      />
    );
  }

  return (
    <LogoShell size={size} variant={variant} className={className}>
      <BuildBrandImage
        domain={brand.domain}
        label={platform}
        className="rounded-sm"
      />
    </LogoShell>
  );
}

type BuildToolNameProps = {
  tool: BuildTool | BuildToolId;
  size?: LogoSize;
  showLogo?: boolean;
  className?: string;
  nameClassName?: string;
};

export function BuildToolName({
  tool,
  size = "sm",
  showLogo = true,
  className,
  nameClassName,
}: BuildToolNameProps) {
  const toolId = typeof tool === "string" ? tool : tool.id;
  const name = typeof tool === "string" ? (getBuildTool(tool)?.name ?? tool) : tool.name;

  return (
    <span className={cn("inline-flex items-center align-middle gap-2", className)}>
      {showLogo ? (
        <BuildToolLogo toolId={toolId} size={size === "lg" ? "sm" : "xs"} variant="inline" />
      ) : null}
      <span className={cn("font-medium leading-none", nameClassName)}>{name}</span>
    </span>
  );
}

type BuildPlatformNameProps = {
  platform: BuildPlatformId;
  label?: string;
  size?: LogoSize;
  showLogo?: boolean;
  className?: string;
};

const PLATFORM_LABELS: Record<BuildPlatformId, string> = {
  github: "GitHub",
  vercel: "Vercel",
  netlify: "Netlify",
};

export function BuildPlatformName({
  platform,
  label,
  size = "sm",
  showLogo = true,
  className,
}: BuildPlatformNameProps) {
  return (
    <span className={cn("inline-flex items-center align-middle gap-1.5", className)}>
      {showLogo ? (
        <BuildPlatformLogo
          platform={platform}
          size={size === "lg" ? "sm" : "xs"}
          variant="inline"
        />
      ) : null}
      <span className="font-medium leading-none">{label ?? PLATFORM_LABELS[platform]}</span>
    </span>
  );
}

type BuildInfraLogoProps = {
  brandId: InfraBrandId;
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
};

export function BuildInfraLogo({
  brandId,
  size = "sm",
  variant = "tile",
  className,
}: BuildInfraLogoProps) {
  const brand = INFRA_BRANDS[brandId];
  const config = SIZE_CONFIG[size];
  const label = INFRA_LABELS[brandId];

  const iconMarkup = (() => {
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
          fallbackColor={brand.fallbackColor}
          className="rounded-sm"
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

type BuildInfraNameProps = {
  brandId: InfraBrandId;
  label?: string;
  size?: LogoSize;
  showLogo?: boolean;
  className?: string;
};

export function BuildInfraName({
  brandId,
  label,
  size = "sm",
  showLogo = true,
  className,
}: BuildInfraNameProps) {
  return (
    <span className={cn("inline-flex items-center align-middle gap-1.5", className)}>
      {showLogo ? (
        <BuildInfraLogo
          brandId={brandId}
          size={size === "lg" ? "sm" : "xs"}
          variant="inline"
        />
      ) : null}
      <span className="font-medium leading-none">{label ?? INFRA_LABELS[brandId]}</span>
    </span>
  );
}

type StackInlineProps = {
  items: string[];
  className?: string;
};

/** Affiche une stack textuelle avec logo discret pour les services infra reconnus. */
export function StackInline({ items, className }: StackInlineProps) {
  if (items.length === 0) return null;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-1 gap-y-0.5", className)}>
      {items.map((item, index) => {
        const brand = matchInfraBrand(item);

        return (
          <span key={`${item}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="px-0.5 text-muted-foreground/40" aria-hidden>
                ·
              </span>
            ) : null}
            {brand ? <BuildInfraLogo brandId={brand} size="xs" variant="inline" /> : null}
            <span>{item}</span>
          </span>
        );
      })}
    </span>
  );
}
