"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuildCopyPromptProps = {
  label?: string;
  text: string;
  className?: string;
  compact?: boolean;
};

export function BuildCopyPrompt({
  label = "Prompt à coller",
  text,
  className,
  compact = false,
}: BuildCopyPromptProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-muted/20", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-xs"
          onClick={() => void handleCopy()}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier"}
        </Button>
      </div>
      <p
        className={cn(
          "whitespace-pre-wrap text-foreground/90",
          compact ? "px-3 py-2 text-xs leading-relaxed" : "px-3 py-2.5 text-sm leading-relaxed",
        )}
      >
        {text}
      </p>
    </div>
  );
}
