"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CampaignContentFieldProps = {
  fieldKey: string;
  label: string;
  value: string;
  maxLength?: number;
  hint?: string;
  multiline?: boolean;
  editing: boolean;
  onChange: (value: string) => void;
};

export function CampaignContentField({
  fieldKey,
  label,
  value,
  maxLength,
  hint,
  multiline,
  editing,
  onChange,
}: CampaignContentFieldProps) {
  const [copied, setCopied] = useState(false);
  const len = value.length;
  const over = maxLength != null && len > maxLength;

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={fieldKey} className="text-xs font-medium text-muted-foreground">
          {label}
        </Label>
        <div className="flex items-center gap-2">
          {maxLength != null ? (
            <span className={cn("font-data text-[10px]", over ? "text-destructive" : "text-muted-foreground")}>
              {len}/{maxLength}
            </span>
          ) : null}
          {value.trim() ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => void handleCopy()}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          ) : null}
        </div>
      </div>
      {editing ? (
        multiline ? (
          <textarea
            id={fieldKey}
            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <Input id={fieldKey} value={value} onChange={(e) => onChange(e.target.value)} />
        )
      ) : (
        <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {value.trim() || "—"}
        </p>
      )}
      {hint ? <p className="text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
