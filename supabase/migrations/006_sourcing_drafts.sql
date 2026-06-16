-- ============================================================
-- SOURCING v2 : drafts, run observability, opportunity status
-- ============================================================

alter table public.sourcing_runs
  add column if not exists cost_usd numeric(10,4),
  add column if not exists tokens_input integer default 0,
  add column if not exists tokens_output integer default 0,
  add column if not exists events jsonb not null default '[]',
  add column if not exists triggered_by uuid references auth.users(id) on delete set null,
  add column if not exists config jsonb not null default '{}';

alter table public.opportunities
  add column if not exists status text not null default 'published'
    check (status in ('draft','published','archived')),
  add column if not exists published_at timestamptz;

update public.opportunities
set published_at = created_at
where published_at is null and status = 'published';

create index if not exists idx_opportunities_status
  on public.opportunities (status);

-- ============================================================
-- TABLE : opportunity_drafts (file d'approbation)
-- ============================================================
create table if not exists public.opportunity_drafts (
  id              uuid primary key default gen_random_uuid(),
  source_run_id   uuid references public.sourcing_runs(id) on delete set null,
  slug            text not null,
  name            text not null,
  payload         jsonb not null,
  score           integer,
  status          text not null default 'pending'
                    check (status in ('pending','approved','rejected','published')),
  dedup_matches   jsonb not null default '[]',
  review_notes    text,
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_opportunity_drafts_status
  on public.opportunity_drafts (status, created_at desc);

create index if not exists idx_opportunity_drafts_slug
  on public.opportunity_drafts (slug);

alter table public.opportunity_drafts enable row level security;

create policy "opportunity_drafts service-role uniquement"
  on public.opportunity_drafts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- TABLE : sourcing_schedules
-- ============================================================
create table if not exists public.sourcing_schedules (
  id            uuid primary key default gen_random_uuid(),
  enabled       boolean not null default true,
  cron_expr     text not null default '0 6 * * 1',
  count         integer not null default 3,
  sector        text,
  premium       boolean not null default false,
  min_score     integer,
  last_run_at   timestamptz,
  next_run_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.sourcing_schedules enable row level security;

create policy "sourcing_schedules service-role uniquement"
  on public.sourcing_schedules for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

insert into public.sourcing_schedules (cron_expr, count, enabled)
values ('0 6 * * 1', 3, true)
on conflict do nothing;
