"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputBase =
  "flex h-10 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

type IdeaProductNameCardProps = {
  initialIdea: string;
  summary?: string;
  value: string;
  onChange: (name: string) => void;
  compact?: boolean;
};

export function IdeaProductNameCard({
  initialIdea,
  summary,
  value,
  onChange,
  compact = false,
}: IdeaProductNameCardProps) {
  const { tier } = useTier();
  const unlocked = hasTier(tier, "builder");
  const [draft, setDraft] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const save = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      onChange(trimmed);
      setDraft(trimmed);
    },
    [onChange],
  );

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/idea/product-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialIdea, summary }),
      });
      const data = (await res.json()) as { suggestions?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur de génération");
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  }, [initialIdea, summary]);

  return (
    <section
      className={cn(
        "rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-card",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="label-data text-primary">Nom de votre SaaS</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choisissez le nom de votre produit — vous pourrez le modifier à tout moment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter" && draft.trim()) save(draft);
              }}
              placeholder="Ex. FactureZen, Planifio…"
              className={inputBase}
            />
            <Button type="button" disabled={!draft.trim()} onClick={() => save(draft)}>
              Valider
            </Button>
            {unlocked ? (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={generating}
                onClick={() => void generate()}
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Générer des idées
              </Button>
            ) : null}
          </div>

          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setDraft(name);
                    save(name);
                  }}
                  className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {name}
                </button>
              ))}
            </div>
          ) : null}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
