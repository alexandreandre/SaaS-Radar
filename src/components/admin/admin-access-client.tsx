"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/brand/logo-mark";
import { ADMIN_ACCESS_GENERIC_ERROR } from "@/lib/admin/access-policy";
import { Button } from "@/components/ui/button";

function sanitizeAdminAccessNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//")) return "/admin";
  if (raw.startsWith("/admin/access")) return "/admin";
  return raw;
}

export function AdminAccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeAdminAccessNext(searchParams.get("next"));

  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (!res.ok) {
        setError(ADMIN_ACCESS_GENERIC_ERROR);
        setStatus("idle");
        return;
      }

      router.push(next.startsWith("/admin/login") ? next : "/admin/login?next=" + encodeURIComponent(next));
      router.refresh();
    } catch {
      setError(ADMIN_ACCESS_GENERIC_ERROR);
      setStatus("idle");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c10] px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/5">
            <LogoMark className="h-7" onDarkBackground aria-hidden={false} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-medium tracking-tight text-white">
              Accès sécurisé
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Token d&apos;accès requis pour ouvrir la console admin.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/95 p-6 shadow-card backdrop-blur sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label
              htmlFor="admin-access-token"
              className="block text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Token d&apos;accès
            </label>
            <input
              id="admin-access-token"
              type="password"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Collez votre token secret"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? "Vérification…" : "Continuer"}
            </Button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}
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
