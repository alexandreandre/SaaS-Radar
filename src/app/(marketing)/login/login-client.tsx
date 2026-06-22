"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand/brand-logo";
import { createClient } from "@/lib/supabase/client";
import { sanitizeAuthNext } from "@/lib/auth/callback-url";
import { Button } from "@/components/ui/button";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeAuthNext(searchParams.get("next"));
  const hasAuthError = searchParams.get("error") === "auth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(
    hasAuthError ? "Connexion impossible. Vérifiez vos identifiants." : null
  );

  const supabase = createClient();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setStatus("loading");
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("idle");
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-center font-display text-2xl font-medium tracking-tight">
            Connexion
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Connectez-vous avec votre email et mot de passe.
          </p>

          <form onSubmit={handlePasswordLogin} className="mt-6 space-y-3">
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos conditions d&apos;utilisation.
        </p>
      </div>
    </main>
  );
}
