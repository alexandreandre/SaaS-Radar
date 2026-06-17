"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Radar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildAuthCallbackUrl, sanitizeAuthNext } from "@/lib/auth/callback-url";
import { getClientSiteOrigin } from "@/lib/site-url";
import { Button } from "@/components/ui/button";

function callbackUrl(next: string): string {
  return buildAuthCallbackUrl(getClientSiteOrigin(), next);
}

export function LoginClient() {
  const searchParams = useSearchParams();
  const next = sanitizeAuthNext(searchParams.get("next"));
  const hasAuthError = searchParams.get("error") === "auth";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(
    hasAuthError ? "Le lien de connexion a expiré ou est invalide. Réessayez." : null
  );

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, next, scope: "app" }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Impossible d'envoyer le lien");
      setStatus("idle");
      return;
    }
    setStatus("sent");
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next) },
    });
    if (error) setError(error.message);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Radar className="h-5 w-5 text-primary" aria-hidden />
          <span className="font-data text-sm font-medium uppercase tracking-[0.18em]">
            SaaS Radar
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-center font-display text-2xl font-medium tracking-tight">
            Connexion
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Recevez un lien magique ou continuez avec Google.
          </p>

          {status === "sent" ? (
            <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">Vérifiez votre boîte mail</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Un lien de connexion a été envoyé à <strong>{email}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-4 text-xs text-primary hover:underline"
              >
                Utiliser une autre adresse
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleMagicLink} className="mt-6 space-y-3">
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
                <Button type="submit" className="w-full" disabled={status === "sending"}>
                  {status === "sending" ? "Envoi…" : "Recevoir le lien magique"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
                <GoogleIcon className="h-4 w-4" />
                Continuer avec Google
              </Button>
            </>
          )}

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
