import Link from "next/link";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  className,
  alert,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-card",
        alert && "border-red-500/40 bg-red-500/5",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 font-display text-2xl font-medium tabular-nums", alert && "text-red-600")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function KpiCardLink({
  href,
  label,
  value,
  hint,
  className,
  alert,
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40 hover:bg-muted/30",
        alert && "border-red-500/40 bg-red-500/5 hover:border-red-500/60",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-2 font-display text-2xl font-medium tabular-nums", alert && "text-red-600")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Link>
  );
}

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="label-data text-muted-foreground">Administration</p>
        <h1 className="mt-1 font-display text-2xl font-medium tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {!children && empty && (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
