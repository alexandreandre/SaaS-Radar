"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  IdeaClarifyPrompt,
  IdeaClarifySuggestion,
  IdeaClarifyTurn,
  IdeaClarityDimension,
} from "@/types/idea-brief";
import { IDEA_CLARITY_DIMENSION_LABELS } from "@/types/idea-brief";

type IdeaClarifyChatProps = {
  turns: IdeaClarifyTurn[];
  pending: IdeaClarifyPrompt | null;
  loading: boolean;
  onSubmitAnswer: (answer: string, meta?: Pick<IdeaClarifyTurn, "questionType" | "dimension">) => void;
};

function DimensionPills({
  active,
  cleared = [],
}: {
  active?: IdeaClarityDimension;
  cleared?: IdeaClarityDimension[];
}) {
  const dimensions = Object.entries(IDEA_CLARITY_DIMENSION_LABELS) as [IdeaClarityDimension, string][];

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Dimensions clarifiées">
      {dimensions.map(([key, label]) => {
        const isActive = active === key;
        const isCleared = cleared.includes(key);
        return (
          <span
            key={key}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
              isActive || isCleared
                ? "bg-primary/15 text-primary"
                : "bg-muted/60 text-muted-foreground/70",
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function MessageBubble({
  role,
  children,
  className,
}: {
  role: "assistant" | "user";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex",
        role === "user" ? "justify-end" : "justify-start",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          role === "assistant"
            ? "rounded-tl-md border border-border/80 bg-card/80 text-foreground shadow-sm"
            : "rounded-tr-md bg-primary text-primary-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SuggestionOption({
  suggestion,
  selected,
  mode,
  onClick,
}: {
  suggestion: IdeaClarifySuggestion;
  selected: boolean;
  mode: "single" | "multi";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border px-3 py-2.5 text-left transition-all",
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border/80 bg-background/60 hover:border-primary/40 hover:bg-primary/5",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
            mode === "multi" ? "rounded-[4px]" : "rounded-full",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 group-hover:border-primary/50",
          )}
          aria-hidden
        >
          {selected ? <Check className="h-2.5 w-2.5" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-snug">{suggestion.label}</span>
          {suggestion.hint ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">{suggestion.hint}</span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

function ClarifyInput({
  pending,
  clearedDimensions,
  disabled,
  onSubmit,
}: {
  pending: IdeaClarifyPrompt;
  clearedDimensions: IdeaClarityDimension[];
  disabled: boolean;
  onSubmit: (answer: string) => void;
}) {
  const { questionType, suggestions, allowCustom, question, dimension } = pending;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customAnswer, setCustomAnswer] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSelectedIds([]);
    setCustomAnswer("");
  }, [question, questionType]);

  useEffect(() => {
    if (questionType === "open" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [questionType, question]);

  const toggleSelection = useCallback(
    (id: string) => {
      if (questionType === "single") {
        const suggestion = suggestions.find((s) => s.id === id);
        if (suggestion) onSubmit(suggestion.label);
        return;
      }
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    },
    [questionType, suggestions, onSubmit],
  );

  const submitMulti = useCallback(() => {
    const labels = suggestions
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => s.label);
    const custom = customAnswer.trim();
    const parts = [...labels, ...(custom ? [custom] : [])];
    if (parts.length === 0) return;
    onSubmit(parts.join(" · "));
  }, [selectedIds, suggestions, customAnswer, onSubmit]);

  const submitOpen = useCallback(() => {
    const value = customAnswer.trim();
    if (!value) return;
    onSubmit(value);
  }, [customAnswer, onSubmit]);

  const hasMultiSelection = selectedIds.length > 0 || customAnswer.trim().length > 0;

  return (
    <div className="space-y-3">
      {dimension || clearedDimensions.length > 0 ? (
        <DimensionPills active={dimension} cleared={clearedDimensions} />
      ) : null}

      {suggestions.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {suggestions.map((suggestion) => (
            <SuggestionOption
              key={suggestion.id}
              suggestion={suggestion}
              selected={selectedIds.includes(suggestion.id)}
              mode={questionType === "multi" ? "multi" : "single"}
              onClick={() => toggleSelection(suggestion.id)}
            />
          ))}
        </div>
      ) : null}

      {questionType === "multi" ? (
        <div className="space-y-2">
          {allowCustom ? (
            <input
              type="text"
              value={customAnswer}
              onChange={(e) => setCustomAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitMulti();
              }}
              placeholder="Ajouter une précision…"
              disabled={disabled}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : null}
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={disabled || !hasMultiSelection}
            onClick={submitMulti}
          >
            Valider ma sélection
          </Button>
        </div>
      ) : null}

      {questionType === "open" || (allowCustom && questionType === "single" && suggestions.length > 0) ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {questionType === "open" ? (
            <textarea
              ref={inputRef}
              value={customAnswer}
              onChange={(e) => setCustomAnswer(e.target.value)}
              rows={3}
              disabled={disabled}
              placeholder="Décrivez avec vos mots…"
              className="min-h-[88px] w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <input
              type="text"
              value={customAnswer}
              onChange={(e) => setCustomAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const value = customAnswer.trim();
                  if (value) onSubmit(value);
                }
              }}
              placeholder="Autre réponse…"
              disabled={disabled}
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
          {(questionType === "open" || customAnswer.trim()) ? (
            <Button
              type="button"
              variant={questionType === "open" ? "default" : "outline"}
              size="sm"
              disabled={disabled || !customAnswer.trim()}
              onClick={questionType === "open" ? submitOpen : () => onSubmit(customAnswer.trim())}
              className="shrink-0"
            >
              Continuer
            </Button>
          ) : null}
        </div>
      ) : null}

      {questionType === "single" && suggestions.length > 0 && !allowCustom ? (
        <p className="text-xs text-muted-foreground">Choisissez l&apos;option la plus proche.</p>
      ) : null}
      {questionType === "multi" && suggestions.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Sélectionnez une ou plusieurs options, puis validez.
        </p>
      ) : null}
    </div>
  );
}

export function IdeaClarifyChat({
  turns,
  pending,
  loading,
  onSubmitAnswer,
}: IdeaClarifyChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns.length, pending?.question, loading]);

  const handleSubmit = useCallback(
    (answer: string) => {
      if (!pending) return;
      onSubmitAnswer(answer, {
        questionType: pending.questionType,
        dimension: pending.dimension,
      });
    },
    [pending, onSubmitAnswer],
  );

  const clearedDimensions = turns
    .map((turn) => turn.dimension)
    .filter((dimension): dimension is IdeaClarityDimension => Boolean(dimension));

  return (
    <div className="space-y-4">
      {turns.map((turn, index) => (
        <div key={`${turn.question}-${index}`} className="space-y-3">
          <MessageBubble role="assistant">
            <p>{turn.question}</p>
          </MessageBubble>
          <MessageBubble role="user">
            <p>{turn.answer}</p>
          </MessageBubble>
        </div>
      ))}

      {loading ? (
        <MessageBubble role="assistant">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>Analyse de votre idée…</span>
          </div>
        </MessageBubble>
      ) : null}

      {pending && !loading ? (
        <div className="space-y-3">
          <MessageBubble role="assistant">
            <div className="space-y-2">
              {pending.insight ? (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
                  <span>{pending.insight}</span>
                </p>
              ) : null}
              <p className="font-medium">{pending.question}</p>
            </div>
          </MessageBubble>
          <ClarifyInput
            pending={pending}
            clearedDimensions={clearedDimensions}
            disabled={loading}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}

      <div ref={scrollRef} aria-hidden />
    </div>
  );
}

export type { IdeaClarifyPrompt };
