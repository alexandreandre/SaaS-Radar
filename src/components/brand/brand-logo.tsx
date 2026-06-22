import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";
import { LogoMark } from "@/components/brand/logo-mark";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  href?: string | null;
  dark?: boolean;
  showName?: boolean;
};

export function BrandLogo({
  className,
  markClassName = "h-7",
  textClassName = "text-sm",
  href = "/",
  dark = false,
  showName = true,
}: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} onDarkBackground={dark} aria-hidden={showName} />
      {showName ? (
        <span
          className={cn(
            "font-semibold tracking-tight whitespace-nowrap",
            textClassName,
            dark ? "text-hero-foreground" : "text-foreground",
          )}
        >
          {BRAND_NAME}
        </span>
      ) : null}
    </span>
  );

  if (href === null) return content;

  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}
