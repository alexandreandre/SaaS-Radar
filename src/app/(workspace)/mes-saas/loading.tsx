export default function MesSaasLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
