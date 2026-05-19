"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

function simulateMrr(
  months: number,
  price: number,
  churnPct: number,
  newCustomers: number,
  cac: number,
  costs: number,
  stress: boolean
) {
  const churn = (stress ? churnPct * 1.5 : churnPct) / 100;
  const customers = stress ? Math.max(1, Math.floor(newCustomers * 0.6)) : newCustomers;
  let active = 0;
  const data: { month: number; mrr: number; customers: number }[] = [];

  for (let m = 1; m <= months; m++) {
    active = Math.round(active * (1 - churn) + customers);
    const mrr = active * price;
    data.push({ month: m, mrr, customers: active });
  }
  return data;
}

function findMonth(data: { mrr: number }[], target: number) {
  const idx = data.findIndex((d) => d.mrr >= target);
  return idx >= 0 ? idx + 1 : null;
}

export default function SimulatorPage() {
  const [price, setPrice] = useState(79);
  const [churn, setChurn] = useState(5);
  const [cac, setCac] = useState(120);
  const [newCustomers, setNewCustomers] = useState(15);
  const [costs, setCosts] = useState(200);
  const [stress, setStress] = useState(false);

  const data = useMemo(
    () => simulateMrr(24, price, churn, newCustomers, cac, costs, stress),
    [price, churn, newCustomers, cac, costs, stress]
  );

  const ltv = price / (churn / 100);
  const ltvCac = ltv / cac;
  const breakEvenMonth = useMemo(() => {
    let cumulative = -cac * newCustomers;
    for (let i = 0; i < data.length; i++) {
      cumulative += data[i].mrr - costs - cac * (stress ? Math.floor(newCustomers * 0.6) : newCustomers);
      if (cumulative >= 0) return i + 1;
    }
    return null;
  }, [data, cac, newCustomers, costs, stress]);

  const m5k = findMonth(data, 5000);
  const m10k = findMonth(data, 10000);
  const m50k = findMonth(data, 50000);

  const ltvColor =
    ltvCac >= 3 ? "text-emerald-600" : ltvCac >= 1 ? "text-amber-600" : "text-red-600";

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Simulateur financier</h1>
        <p className="mt-2 text-muted-foreground">
          Modélisez votre MRR sur 24 mois et trouvez votre break-even
        </p>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row">
          <aside className="w-full space-y-8 lg:w-80">
            <SliderField label="Prix / mois" value={price} min={29} max={499} step={10} format={(v) => `${v}€`} onChange={setPrice} />
            <SliderField label="Churn mensuel" value={churn} min={1} max={15} step={0.5} format={(v) => `${v}%`} onChange={setChurn} />
            <SliderField label="CAC" value={cac} min={50} max={500} step={10} format={(v) => `${v}€`} onChange={setCac} />
            <SliderField label="Nouveaux clients / mois" value={newCustomers} min={1} max={100} step={1} format={(v) => `${v}`} onChange={setNewCustomers} />
            <SliderField label="Coûts serveur + API" value={costs} min={50} max={2000} step={50} format={(v) => `${v}€/mois`} onChange={setCosts} />

            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <Label>Stress test</Label>
                <p className="text-xs text-muted-foreground">Churn +50%, acquisition -40%</p>
              </div>
              <Switch checked={stress} onCheckedChange={setStress} />
            </div>
          </aside>

          <div className="flex-1 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="MRR mois 24" value={formatCurrency(data[23]?.mrr ?? 0)} />
              <StatCard label="Break-even" value={breakEvenMonth ? `Mois ${breakEvenMonth}` : "24+ mois"} highlight />
              <StatCard label="LTV / CAC" value={`${ltvCac.toFixed(1)}x`} className={ltvColor} />
              <StatCard label="LTV estimé" value={formatCurrency(ltv)} />
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <Milestone label="5 000€ MRR" month={m5k} />
              <Milestone label="10 000€ MRR" month={m10k} />
              <Milestone label="50 000€ MRR" month={m50k} />
            </div>

            <div className="rounded-xl border border-border bg-white p-4">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">Courbe MRR — 24 mois</h2>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} labelFormatter={(l) => `Mois ${l}`} />
                  {breakEvenMonth && (
                    <ReferenceLine x={breakEvenMonth} stroke="#2563EB" strokeDasharray="4 4" label="Break-even" />
                  )}
                  <Line type="monotone" dataKey="mrr" stroke="#2563EB" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {stress && (
              <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                Mode stress : churn à {(churn * 1.5).toFixed(1)}%, {Math.floor(newCustomers * 0.6)} nouveaux clients/mois.
                Vérifiez que votre trésorerie couvre au moins {breakEvenMonth ?? 24} mois avant rentabilité.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-semibold tabular-nums">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function StatCard({ label, value, highlight, className }: { label: string; value: string; highlight?: boolean; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-white p-4", highlight && "border-accent ring-1 ring-accent")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", className)}>{value}</p>
    </div>
  );
}

function Milestone({ label, month }: { label: string; month: number | null }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-4 py-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{month ? `Mois ${month}` : "—"}</p>
    </div>
  );
}