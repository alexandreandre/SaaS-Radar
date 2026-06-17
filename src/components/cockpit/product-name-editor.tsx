"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductNameEditorProps = {
  value: string;
  onSave: (name: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  size?: "sm" | "lg" | "sidebar";
  onEditRequest?: () => void;
};

const inputBase =
  "flex w-full rounded-lg border border-input bg-background px-3 py-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring";

export function ProductNameEditor({
  value,
  onSave,
  className,
  inputClassName,
  placeholder = "Nom du produit",
  size = "lg",
  onEditRequest,
}: ProductNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const startEditing = () => {
    onEditRequest?.();
    setEditing(true);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        onBlur={commit}
        placeholder={placeholder}
        className={cn(
          inputBase,
          size === "lg" && "h-10 text-2xl font-medium",
          size === "sm" && "h-8 text-sm font-medium",
          size === "sidebar" && "h-8 text-sm font-semibold",
          inputClassName,
        )}
      />
    );
  }

  if (size === "sidebar") {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={cn(
          "group inline-flex max-w-full items-center gap-1.5 rounded-md text-left transition-colors hover:text-primary",
          className,
        )}
      >
        <span className="truncate text-sm font-semibold leading-tight">
          {value || placeholder}
        </span>
        <Pencil
          className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
        <span className="sr-only">Modifier le nom</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className={cn(
        "group inline-flex max-w-full items-center gap-2 rounded-md text-left transition-colors hover:text-primary",
        className,
      )}
    >
      <span
        className={cn(
          "truncate font-display font-medium tracking-tight",
          size === "lg" ? "text-3xl" : "text-sm",
        )}
      >
        {value || placeholder}
      </span>
      <Pencil
        className={cn(
          "shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
          size === "lg" ? "h-4 w-4" : "h-3 w-3",
        )}
        aria-hidden
      />
      <span className="sr-only">Modifier le nom</span>
    </button>
  );
}
