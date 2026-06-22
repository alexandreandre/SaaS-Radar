"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Sector } from "@/types/opportunity";
import type { SectorCatalogEntry } from "@/data/sectors";
import {
  getSectorDisplayLabel,
  getTopSectorPickerSuggestions,
  isPrimarySectorFilter,
  searchSectorCatalog,
} from "@/data/sectors";
import { cn } from "@/lib/utils";

function SectorOption({
  entry,
  selected,
  onPick,
}: {
  entry: SectorCatalogEntry;
  selected: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onPick(entry.id)}
      className={cn(
        "flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-muted"
      )}
    >
      <span className="font-medium leading-snug">{entry.label}</span>
      <span
        className={cn(
          "mt-0.5 font-data text-[10px] uppercase tracking-data",
          selected ? "text-accent-foreground/80" : "text-muted-foreground"
        )}
      >
        {entry.group}
      </span>
    </button>
  );
}

type SectorSearchPickerProps = {
  value: string;
  onChange: (sectorId: string) => void;
  chipClass: (active: boolean) => string;
  presentSectors?: Sector[];
};

export function SectorSearchPicker({
  value,
  onChange,
  chipClass,
  presentSectors = [],
}: SectorSearchPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const isCatalogActive = !isPrimarySectorFilter(value) && value !== "all";
  const hasQuery = query.trim().length > 0;
  const suggestions = getTopSectorPickerSuggestions(presentSectors);
  const results = hasQuery ? searchSectorCatalog(query) : [];
  const selectedLabel = isCatalogActive ? getSectorDisplayLabel(value) : null;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const pick = (id: string) => {
    onChange(id);
    close();
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        className={cn(chipClass(isCatalogActive), "inline-flex items-center gap-1 pr-2")}
      >
        <span className="max-w-[9rem] truncate sm:max-w-[11rem]">
          {selectedLabel ?? "Autre secteur…"}
        </span>
        <ChevronDown
          className={cn("h-3 w-3 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1.5 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-panel"
          role="presentation"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un secteur…"
                aria-controls={listId}
                autoComplete="off"
                className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Effacer la recherche"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1" id={listId} role="listbox">
            {!hasQuery ? (
              <>
                <p className="px-3 pb-1 pt-2 font-data text-[10px] font-medium uppercase tracking-data text-muted-foreground">
                  Populaires
                </p>
                {suggestions.map((entry) => (
                  <SectorOption
                    key={entry.id}
                    entry={entry}
                    selected={value === entry.id}
                    onPick={pick}
                  />
                ))}
                <p className="border-t border-border px-3 py-2.5 text-center text-[11px] text-muted-foreground">
                  Recherchez pour afficher d&apos;autres secteurs
                </p>
              </>
            ) : results.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Aucun secteur pour « {query} »
              </p>
            ) : (
              results.map((entry) => (
                <SectorOption
                  key={entry.id}
                  entry={entry}
                  selected={value === entry.id}
                  onPick={pick}
                />
              ))
            )}
          </div>

          {isCatalogActive && (
            <div className="border-t border-border p-1.5">
              <button
                type="button"
                onClick={() => {
                  onChange("all");
                  close();
                }}
                className="w-full rounded-md px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Réinitialiser le filtre
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
