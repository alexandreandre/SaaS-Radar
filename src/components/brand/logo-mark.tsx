import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  /** Force la variante blanche (fond sombre hero, admin login, etc.) */
  onDarkBackground?: boolean;
  "aria-hidden"?: boolean;
};

const LIGHT_SRC = "/brand/logo-mark-light.png";
const DARK_SRC = "/brand/logo-mark-dark.png";
const MARK_WIDTH = 526;
const MARK_HEIGHT = 295;

/** Pictogramme PNG recadré, fond transparent — noir sur clair, blanc sur sombre. */
export function LogoMark({
  className,
  onDarkBackground = false,
  "aria-hidden": ariaHidden = true,
}: LogoMarkProps) {
  const sizeClass = cn("h-[1.25em] w-auto shrink-0", className);

  return (
    <span
      className={cn("inline-flex items-center", ariaHidden && "select-none")}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : "The Build Road"}
      aria-hidden={ariaHidden}
    >
      <Image
        src={LIGHT_SRC}
        alt=""
        width={MARK_WIDTH}
        height={MARK_HEIGHT}
        aria-hidden
        className={cn(
          sizeClass,
          onDarkBackground ? "hidden" : "dark:hidden",
        )}
      />
      <Image
        src={DARK_SRC}
        alt=""
        width={MARK_WIDTH}
        height={MARK_HEIGHT}
        aria-hidden
        className={cn(
          sizeClass,
          onDarkBackground ? "block" : "hidden dark:block",
        )}
      />
    </span>
  );
}
