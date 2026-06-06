export default function CockpitLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-12 w-96 max-w-full animate-pulse rounded bg-muted" />
      <div className="mt-4 h-16 animate-pulse rounded-xl bg-muted" />
      <div className="mt-6 grid gap-6 xl:grid-cols-[220px_1fr_280px]">
        <div className="hidden h-[400px] animate-pulse rounded-xl bg-muted xl:block" />
        <div className="h-[500px] animate-pulse rounded-xl bg-muted" />
        <div className="h-[400px] animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
