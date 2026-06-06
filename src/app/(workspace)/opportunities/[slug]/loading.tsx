export default function OpportunityDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-8 h-64 animate-pulse rounded-lg border border-border bg-muted/40" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
