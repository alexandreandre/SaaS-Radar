export function SectionTitle({
  number,
  title,
  subtitle,
  variant = "detail",
}: {
  number: number;
  title: string;
  subtitle?: string;
  variant?: "detail" | "playbook";
}) {
  if (variant === "playbook") {
    return (
      <header className="mb-4 border-b border-border/40 pb-3">
        <h2 className="font-display text-lg font-medium leading-tight tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground/60">
        {String(number).padStart(2, "0")}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}
