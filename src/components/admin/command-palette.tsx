"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const ROUTES = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sourcing", label: "Sourcing" },
  { href: "/admin/opportunities", label: "Catalogue" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/billing", label: "Abonnements" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/markets", label: "Carte & pays" },
  { href: "/admin/system", label: "Système" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/security", label: "Sécurité" },
];

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = ROUTES.filter((r) =>
    r.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        Rechercher…
        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Aller à…"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {filtered.map((route) => (
            <li key={route.href}>
              <button
                type="button"
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  router.push(route.href);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {route.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
