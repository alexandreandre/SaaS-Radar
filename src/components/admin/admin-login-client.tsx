"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/brand/logo-mark";
import { sanitizeAdminNext } from "@/lib/auth/callback-url";
import { ADMIN_LOGIN_GENERIC_ERROR } from "@/lib/admin/access-policy";
import { Button } from "@/components/ui/button";

type LoginResponse = { status: "ok" } | { error: string };

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
    hasAuthError ? ADMIN_LOGIN_GENERIC_ERROR : null
  );

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as LoginResponse;

      if (!res.ok || "error" in data) {
        setError(ADMIN_LOGIN_GENERIC_ERROR);
        setStatus("idle");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError(ADMIN_LOGIN_GENERIC_ERROR);
      setStatus("idle");
    }
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
          autoComplete="username"
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
            <h1 className="font-display text-2xl font-medium tracking-tight text-white">
              Console opérateur
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Connexion réservée aux opérateurs autorisés.
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
