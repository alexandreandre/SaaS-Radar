"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function callbackUrl(next: string): string {
  const origin = window.location.origin;
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const qs = params.toString();
  return `${origin}/auth/callback${qs ? `?${qs}` : ""}`;
}

/** Redirection post-auth : uniquement des chemins /admin (anti open-redirect). */
function sanitizeAdminNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) return "/admin";
  if (raw.startsWith("/admin/login")) return "/admin";
  return raw;
}

export function AdminLoginClient({
  forbidden = false,
  signedInEmail,
}: {
  forbidden?: boolean;
  signedInEmail?: string | null;
}) {
  const searchParams = useSearchParams();
  const next = sanitizeAdminNext(searchParams.get("next"));
  const hasAuthError = searchParams.get("error") === "auth";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(
    hasAuthError ? "Le lien a expiré ou est invalide. Réessayez." : null
  );

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(next) },
    });
    if (otpError) {
      setError(otpError.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next) },
    });
    if (oauthError) setError(oauthError.message);
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
      {status === "sent" ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-6 text-center">
          <p className="text-sm font-medium">Vérifiez votre boîte mail</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lien envoyé à <strong>{email}</strong>.
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-4 text-xs text-primary hover:underline"
          >
            Autre adresse
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleMagicLink} className="space-y-3">
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
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? "Envoi…" : "Recevoir le lien sécurisé"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            <GoogleIcon className="h-4 w-4" />
            Google (compte autorisé)
          </Button>
        </>
      )}

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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Shield className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <div className="text-center">
            <p className="font-data text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              SaaS Radar
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
