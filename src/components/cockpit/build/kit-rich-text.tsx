"use client";

import { parseKitInlineMarkdown, parseKitStep, type KitTextPart } from "@/lib/build/kit-content";
import { cn } from "@/lib/utils";

function InlineParts({ parts }: { parts: KitTextPart[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "bold") {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.value}
            </strong>
          );
        }
        if (part.type === "code") {
          return (
            <code
              key={i}
              className="rounded border border-border/60 bg-muted/60 px-1 py-0.5 font-mono text-[0.85em] text-foreground"
            >
              {part.value}
            </code>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}

export function KitRichText({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className}>
      <InlineParts parts={parseKitInlineMarkdown(text)} />
    </p>
  );
}

export function KitStepText({ text, className }: { text: string; className?: string }) {
  const { title, body } = parseKitStep(text);

  if (title) {
    return (
      <div className={cn("min-w-0", className)}>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          <InlineParts parts={parseKitInlineMarkdown(body)} />
        </p>
      </div>
    );
  }

  return (
    <p className={cn("text-sm leading-relaxed text-foreground", className)}>
      <InlineParts parts={parseKitInlineMarkdown(text)} />
    </p>
  );
}
