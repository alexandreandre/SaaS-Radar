-- ============================================================
-- TABLE : sourcing_runs (observabilité des runs de sourcing)
-- ============================================================
create table if not exists public.sourcing_runs (
  id                uuid primary key default gen_random_uuid(),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  status            text not null default 'running'
                      check (status in ('running','ok','partial','empty','error')),
  count_requested   integer not null default 0,
  count_discovered  integer not null default 0,
  count_structured  integer not null default 0,
  count_written     integer not null default 0,
  sector            text,
  premium           boolean not null default false,
  cost_line         text,
  skipped           jsonb not null default '[]',
  error             text
);

create index if not exists idx_sourcing_runs_started_at
  on public.sourcing_runs(started_at desc);

-- RLS : lecture/écriture réservées au service-role (pas d'exposition publique).
alter table public.sourcing_runs enable row level security;

create policy "sourcing_runs service-role uniquement"
  on public.sourcing_runs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
