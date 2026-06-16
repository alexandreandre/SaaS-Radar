"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSourcingCountryCatalog } from "@/data/sourcing-country-catalog";
import {
  buildSearchableCountries,
  matchesCountryQuery,
  priorityCountries,
  type SearchableCountry,
} from "@/lib/sourcing/country-search";

export type CountryOption = { code: string; name: string; flag: string };

type CountryMultiSelectProps = {
  /** Ignoré si vide — le catalogue ISO2 local est toujours la source de vérité UI. */
  markets?: CountryOption[];
  selected: string[];
  onChange: (codes: string[]) => void;
  max?: number;
  min?: number;
  label?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
};

type MenuPos = { top: number; left: number; width: number };

export function CountryMultiSelect({
  markets,
  selected,
  onChange,
  max = 5,
  min = 0,
  label,
  hint,
  placeholder = "Tapez un pays (ex. France, US, Royaume-Uni)…",
  disabled = false,
}: CountryMultiSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const catalog = useMemo(() => {
    const base = getSourcingCountryCatalog();
    if (!markets?.length) return buildSearchableCountries(base);

    const overrides = new Map(
      markets.map((m) => [m.code.toUpperCase(), m] as const)
    );
    const merged = base.map((c) => {
      const o = overrides.get(c.code);
      return o ? { ...c, name: o.name || c.name, flag: o.flag || c.flag } : c;
    });
    return buildSearchableCountries(merged);
  }, [markets]);

  const marketByCode = useMemo(() => {
    const map = new Map<string, SearchableCountry>();
    for (const m of catalog) map.set(m.code, m);
    return map;
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return priorityCountries(catalog);
    return catalog.filter((m) => matchesCountryQuery(m, q));
  }, [catalog, query]);

  const hasQuery = query.trim().length > 0;
  const showList = open && filtered.length > 0;
  const showEmpty = open && hasQuery && filtered.length === 0;

  const updateMenuPos = () => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPos();
    const onScrollOrResize = () => updateMenuPos();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, query, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (document.getElementById(listId)?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, listId]);

  const toggle = (code: string) => {
    if (disabled) return;
    if (selected.includes(code)) {
      const next = selected.filter((c) => c !== code);
      if (next.length >= min) onChange(next);
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, code]);
    setQuery("");
    inputRef.current?.focus();
  };

  const remove = (code: string) => {
    if (disabled) return;
    const next = selected.filter((c) => c !== code);
    if (next.length >= min) onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && open && filtered[activeIndex]) {
      e.preventDefault();
      toggle(filtered[activeIndex].code);
    }
  };

  const menuContent = showList ? (
    <div
      id={listId}
      role="listbox"
      className="rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg"
      style={{
        position: "fixed",
        top: menuPos?.top ?? 0,
        left: menuPos?.left ?? 0,
        width: menuPos?.width ?? 280,
        zIndex: 9999,
        maxHeight: 280,
        overflowY: "auto",
      }}
    >
      {!hasQuery && (
        <p className="border-b border-border bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground">
          Pays fréquents — ou tapez pour filtrer
        </p>
      )}
      {filtered.map((m, index) => {
        const isSelected = selected.includes(m.code);
        const atMax = !isSelected && selected.length >= max;
        return (
          <button
            key={m.code}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={atMax}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
              index === activeIndex && "bg-muted",
              isSelected && "bg-primary/5 text-primary",
              atMax && "cursor-not-allowed opacity-40",
              !atMax && "hover:bg-muted/80"
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggle(m.code)}
          >
            <span className="text-base leading-none">{m.flag}</span>
            <span className="font-medium tabular-nums">{m.code}</span>
            <span className="truncate text-muted-foreground">{m.nameFr}</span>
            {isSelected && (
              <span className="ml-auto shrink-0 text-xs text-primary">Sélectionné</span>
            )}
          </button>
        );
      })}
    </div>
  ) : showEmpty ? (
    <div
      className="rounded-md border border-border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg"
      style={{
        position: "fixed",
        top: menuPos?.top ?? 0,
        left: menuPos?.left ?? 0,
        width: menuPos?.width ?? 280,
        zIndex: 9999,
      }}
    >
      Aucun pays pour « {query} »
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label className="text-xs uppercase text-muted-foreground">{label}</label>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((code) => {
            const m = marketByCode.get(code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                <span>{m?.flag ?? "🏳️"}</span>
                <span className="font-medium">{code}</span>
                {m?.nameFr && (
                  <span className="hidden text-primary/80 sm:inline">{m.nameFr}</span>
                )}
                {!disabled && (
                  <button
                    type="button"
                    className="ml-0.5 inline-flex rounded p-0.5 text-primary/70 hover:bg-primary/20 hover:text-primary"
                    aria-label={`Retirer ${code}`}
                    onClick={() => remove(code)}
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="relative mt-2">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            requestAnimationFrame(updateMenuPos);
          }}
          onFocus={() => {
            setOpen(true);
            updateMenuPos();
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {mounted && menuPos && menuContent ? createPortal(menuContent, document.body) : null}

      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
