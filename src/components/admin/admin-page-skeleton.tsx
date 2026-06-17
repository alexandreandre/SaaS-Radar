export function AdminPageSkeleton({ kpiCount = 4 }: { kpiCount?: number }) {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full rounded-md bg-muted/70" />
      </div>
      {kpiCount > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: kpiCount }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border border-border bg-muted/40" />
          ))}
        </div>
      ) : null}
      <div className="h-64 rounded-lg border border-border bg-muted/30" />
    </div>
  );
}
