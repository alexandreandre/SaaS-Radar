export function MesSaasContentSkeleton() {
  return (
    <div className="mt-8 space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-4 w-64 animate-pulse rounded bg-muted" />
      </section>
    </div>
  );
}
