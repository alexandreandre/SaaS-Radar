import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PlaybookSections({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-5", className)}>{children}</div>;
}

export function PlaybookSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative min-w-0 overflow-hidden rounded-xl border border-border/60 bg-muted/15",
        "before:pointer-events-none before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-primary/35",
        "px-4 py-4 sm:px-5 sm:py-5",
        className,
      )}
    >
      {children}
    </section>
  );
}
