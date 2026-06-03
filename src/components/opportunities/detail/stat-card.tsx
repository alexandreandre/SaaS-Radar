export function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-lg" aria-hidden>
        {icon}
      </p>
    </div>
  );
}
