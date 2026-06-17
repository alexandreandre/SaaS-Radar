"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { faviconUrl } from "@/lib/build/brands";

type BuildBrandImageProps = {
  domain: string;
  label: string;
  className?: string;
  fallbackColor?: string;
};

export function BuildBrandImage({
  domain,
  label,
  className,
  fallbackColor = "#6366F1",
}: BuildBrandImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "flex h-full w-full items-center justify-center text-[10px] font-bold text-white",
          className,
        )}
        style={{ backgroundColor: fallbackColor }}
        aria-hidden
      >
        {label.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl(domain, 128)}
      alt=""
      className={cn("h-full w-full object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}
