-- ============================================================
-- SOURCING foundations : statut queued + file de jobs
-- ============================================================

alter table public.sourcing_runs drop constraint if exists sourcing_runs_status_check;

alter table public.sourcing_runs
  add constraint sourcing_runs_status_check
  check (status in ('queued', 'running', 'ok', 'partial', 'empty', 'error'));

create table if not exists public.sourcing_job_queue (
  id            uuid primary key default gen_random_uuid(),
  batch_id      uuid not null,
  run_id        uuid not null references public.sourcing_runs(id) on delete cascade,
  country_code  text not null,
  status        text not null default 'pending'
                  check (status in ('pending', 'processing', 'done', 'failed', 'cancelled')),
  attempts      integer not null default 0,
  max_attempts  integer not null default 3,
  payload       jsonb not null default '{}',
  error         text,
  scheduled_at  timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_sourcing_job_queue_pending
  on public.sourcing_job_queue (status, scheduled_at)
  where status = 'pending';

create index if not exists idx_sourcing_job_queue_batch
  on public.sourcing_job_queue (batch_id);

alter table public.sourcing_job_queue enable row level security;

create policy "sourcing_job_queue service-role uniquement"
  on public.sourcing_job_queue for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Claim atomique du prochain job (FOR UPDATE SKIP LOCKED)
create or replace function public.claim_sourcing_job()
returns setof public.sourcing_job_queue
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.sourcing_job_queue;
begin
  select * into job
  from public.sourcing_job_queue
  where status = 'pending'
    and scheduled_at <= now()
  order by scheduled_at asc
  limit 1
  for update skip locked;

  if job.id is null then
    return;
  end if;

  update public.sourcing_job_queue
  set status = 'processing',
      attempts = attempts + 1,
      started_at = now()
  where id = job.id
  returning * into job;

  return next job;
end;
$$;
