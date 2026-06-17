"use client";

import {
  BUILD_PROMPT_LANGUAGE_TOGGLE_LABEL,
  type BuildPromptLanguage,
} from "@/lib/build/prompt-language";
import { cn } from "@/lib/utils";

type BuildPromptLanguageToggleProps = {
  value: BuildPromptLanguage;
  onChange: (language: BuildPromptLanguage) => void;
  className?: string;
};

export function BuildPromptLanguageToggle({
  value,
  onChange,
  className,
}: BuildPromptLanguageToggleProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      title="Langue dans laquelle le prompt à coller dans votre outil est généré"
    >
      <span className="whitespace-nowrap text-[11px] text-muted-foreground">
        {BUILD_PROMPT_LANGUAGE_TOGGLE_LABEL}
      </span>
      <div
        className="inline-flex items-center rounded-lg border border-border bg-muted/20 p-0.5"
        role="group"
        aria-label={BUILD_PROMPT_LANGUAGE_TOGGLE_LABEL}
      >
        {(["fr", "en"] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            aria-pressed={value === code}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              value === code
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
