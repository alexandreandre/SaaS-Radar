export function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground/60">
        {String(number).padStart(2, "0")}
      </span>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
  );
}
