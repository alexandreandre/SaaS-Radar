import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PlaybookCollapsibleBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group rounded-2xl border border-border bg-card", className)}>
      <summary className="cursor-pointer list-none px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          {title}
          <span className="text-[10px] font-normal normal-case text-muted-foreground/60 transition-colors group-open:text-muted-foreground">
            (cliquer pour développer)
          </span>
        </span>
      </summary>
      <div className="border-t border-border px-6 pb-6 pt-2">{children}</div>
    </details>
  );
}
