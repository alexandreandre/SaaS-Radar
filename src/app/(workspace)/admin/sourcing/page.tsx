"use client";

import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { SECTORS } from "@/lib/sourcing/constants";

const SECRET_STORAGE_KEY = "saasradar.admin.sourcingSecret";

type SourcingRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  count_requested: number;
  count_discovered: number;
  count_structured: number;
  count_written: number;
  sector: string | null;
  premium: boolean;
  cost_line: string | null;
  error: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-500",
  partial: "bg-amber-500/15 text-amber-500",
  empty: "bg-muted text-muted-foreground",
  running: "bg-primary/15 text-primary",
  error: "bg-red-500/15 text-red-500",
};

export default function AdminSourcingPage() {
  const [secret, setSecret] = useState("");
  const [count, setCount] = useState(3);
  const [sector, setSector] = useState("");
  const [premium, setPremium] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<SourcingRun[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(SECRET_STORAGE_KEY);
    if (stored) setSecret(stored);
  }, []);

  const persistSecret = useCallback((value: string) => {
    setSecret(value);
    if (value) localStorage.setItem(SECRET_STORAGE_KEY, value);
    else localStorage.removeItem(SECRET_STORAGE_KEY);
  }, []);

  const loadRuns = useCallback(async () => {
    if (!secret) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/sourcing", {
        headers: { "x-admin-secret": secret },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setRuns(json.runs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [secret]);

  useEffect(() => {
    if (secret) void loadRuns();
  }, [secret, loadRuns]);

  const launch = useCallback(async () => {
    if (!secret) {
      setError("Renseigne le secret admin.");
      return;
    }
    setRunning(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sourcing", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ count, sector: sector || undefined, premium }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      const report = json.report;
      setMessage(
        `Run ${report.status} — ${report.written} fiche(s) écrite(s) sur ${report.requested} demandée(s). ${report.costLine ?? ""}`
      );
      await loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }, [secret, count, sector, premium, loadRuns]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="label-data text-muted-foreground">Super-admin</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">
            Pilotage du sourcing
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Déclenche un run de sourcing IA et suis les exécutions récentes. Protégé par un
            secret admin (header <code>x-admin-secret</code>).
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card p-5 shadow-card">
          <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Secret admin
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => persistSecret(e.target.value)}
            placeholder="ADMIN_SOURCING_SECRET"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Nombre de fiches
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Number.parseInt(e.target.value, 10) || 1)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Secteur
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Tous</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={premium}
                  onChange={(e) => setPremium(e.target.checked)}
                />
                Enrichissement premium
              </label>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button onClick={launch} disabled={running}>
              {running ? "Sourcing en cours…" : "Lancer le sourcing"}
            </Button>
            <Button variant="outline" onClick={() => void loadRuns()} disabled={!secret}>
              Rafraîchir
            </Button>
          </div>

          {message && (
            <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-medium">Runs récents</h2>
          {runs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              Aucun run enregistré (ou secret non renseigné).
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Démarré</th>
                    <th className="px-3 py-2">Statut</th>
                    <th className="px-3 py-2">Demandé</th>
                    <th className="px-3 py-2">Écrites</th>
                    <th className="px-3 py-2">Secteur</th>
                    <th className="px-3 py-2">Premium</th>
                    <th className="px-3 py-2">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-t border-border">
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {new Date(run.started_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[run.status] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{run.count_requested}</td>
                      <td className="px-3 py-2 tabular-nums">{run.count_written}</td>
                      <td className="px-3 py-2">{run.sector ?? "—"}</td>
                      <td className="px-3 py-2">{run.premium ? "oui" : "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {run.cost_line ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
