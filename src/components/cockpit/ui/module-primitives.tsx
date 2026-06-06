export function ChartSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-data text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
