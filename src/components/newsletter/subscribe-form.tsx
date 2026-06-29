"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Mail } from "lucide-react";

export function SubscribeForm({
  className,
  variant = "default",
  placeholder = "votre@email.fr",
  buttonLabel = "S'abonner gratuitement",
}: {
  className?: string;
  variant?: "default" | "dark" | "compact";
  placeholder?: string;
  buttonLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Entrez une adresse email valide.");
      return;
    }
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "newsletter-page" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Inscription impossible");
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
    }
  };

  if (subscribed) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border px-4 py-3",
          variant === "dark"
            ? "border-primary/30 bg-primary/10 text-hero-foreground"
            : "border-primary/20 bg-accent/50 text-foreground",
          className
        )}
      >
        <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm font-medium">
          C&apos;est noté — la prochaine édition part lundi matin à 08:00 UTC.
        </p>
      </div>
    );
  }

  const isCompact = variant === "compact";
  const isDark = variant === "dark";

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div
        className={cn(
          "flex gap-2",
          isCompact ? "flex-row" : "flex-col sm:flex-row"
        )}
      >
        <div className="relative min-w-0 flex-1">
          <Mail
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
              isDark ? "text-map-muted" : "text-muted-foreground"
            )}
            aria-hidden
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-md border py-2.5 pl-10 pr-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isDark
                ? "border-hero-foreground/15 bg-hero-foreground/5 text-hero-foreground placeholder:text-map-muted"
                : "border-border bg-background text-foreground placeholder:text-muted-foreground"
            )}
            aria-label="Adresse email"
          />
        </div>
        <Button
          type="submit"
          size={isCompact ? "sm" : "lg"}
          className={cn("shrink-0", isCompact && "px-4")}
        >
          {buttonLabel}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p
        className={cn(
          "mt-2 text-xs",
          isDark ? "text-map-muted" : "text-muted-foreground"
        )}
      >
        Gratuit · 1 email/semaine · Désabonnement en 1 clic
      </p>
    </form>
  );
}
