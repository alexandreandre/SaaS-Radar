"use client";

export function CockpitModuleSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
