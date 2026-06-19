-- File de jobs sync connecteurs (Phase 8 — scale async interne)
create table if not exists public.connector_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id text not null,
  provider text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists connector_sync_jobs_status_created_idx
  on public.connector_sync_jobs (status, created_at);

create index if not exists connector_sync_jobs_user_project_idx
  on public.connector_sync_jobs (user_id, project_id);

alter table public.connector_sync_jobs enable row level security;

create policy connector_sync_jobs_service_role on public.connector_sync_jobs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
