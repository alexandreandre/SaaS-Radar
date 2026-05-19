"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/world", label: "Carte monde" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/weekly", label: "Pick de la semaine" },
  { href: "/simulator", label: "Simulateur" },
  { href: "/compare", label: "Comparer" },
];

export function Navbar({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        dark ? "border-white/10 bg-hero/80" : "border-border bg-white/80"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-accent" />
          <span className={cn("text-sm font-semibold tracking-tight", dark ? "text-white" : "text-foreground")}>
            SaaS Radar
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors hover:text-accent",
                dark
                  ? pathname === link.href
                    ? "text-white"
                    : "text-zinc-400"
                  : pathname === link.href
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant={dark ? "outline" : "ghost"}
            size="sm"
            className={dark ? "border-white/20 text-white hover:bg-white/10" : ""}
            asChild
          >
            <Link href="/dashboard">Connexion</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/world">Carte monde</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
