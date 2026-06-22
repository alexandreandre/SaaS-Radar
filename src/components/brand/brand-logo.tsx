import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";
import { LogoMark } from "@/components/brand/logo-mark";

type BrandLogoProps = {
  className?: string;
  /** Taille du pictogramme (hauteur Tailwind, ex. h-7). */
  markClassName?: string;
  /** Lien vers l'accueil (défaut). Passer `null` pour un bloc statique. */
  href?: string | null;
  /** Navbar hero sombre — pictogramme et texte clairs. */
  dark?: boolean;
};

export function BrandLogo({
  className,
  markClassName = "h-7",
  href = "/",
  dark = false,
}: BrandLogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark
        className={markClassName}
        onDarkBackground={dark}
        aria-hidden
      />
      <span
        className={cn(
          "text-sm font-semibold tracking-tight whitespace-nowrap",
          dark ? "text-hero-foreground" : "text-foreground",
        )}
      >
        {BRAND_NAME}
      </span>
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
