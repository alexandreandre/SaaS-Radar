"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND_NAME } from "@/lib/brand";
import { LogoMark } from "@/components/brand/logo-mark";
import { createClient } from "@/lib/supabase/client";
import { sanitizeAdminNext } from "@/lib/auth/callback-url";
import { Button } from "@/components/ui/button";

export function AdminLoginClient({
  forbidden = false,
  signedInEmail,
}: {
  forbidden?: boolean;
  signedInEmail?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeAdminNext(searchParams.get("next"));
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

  if (forbidden) {
    return (
      <AdminLoginShell>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-5 text-center">
          <p className="text-sm font-medium text-foreground">Accès refusé</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {signedInEmail ? (
              <>
                Le compte <strong>{signedInEmail}</strong> n&apos;a pas de droits
                administrateur.
              </>
            ) : (
              "Ce compte n'a pas de droits administrateur."
            )}
          </p>
        </div>
        <form action="/auth/signout" method="post" className="mt-4">
          <Button type="submit" variant="outline" className="w-full">
            Se déconnecter et changer de compte
          </Button>
        </form>
      </AdminLoginShell>
    );
  }

  return (
    <AdminLoginShell>
      <form onSubmit={handlePasswordLogin} className="space-y-3">
        <label
          htmlFor="admin-email"
          className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Email opérateur
        </label>
        <input
          id="admin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@votredomaine.fr"
          autoComplete="email"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <label
          htmlFor="admin-password"
          className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Mot de passe
        </label>
        <input
          id="admin-password"
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

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Connexion réservée aux opérateurs autorisés
      </p>
    </AdminLoginShell>
  );
}

function AdminLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c10] px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/5">
            <LogoMark className="h-7" onDarkBackground aria-hidden={false} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold tracking-tight text-white/90">
              {BRAND_NAME}
            </p>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight text-white">
              Administration
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Accès réservé aux opérateurs autorisés.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/95 p-6 shadow-card backdrop-blur sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Retour au site public
          </Link>
        </p>
      </div>
    </main>
  );
}
