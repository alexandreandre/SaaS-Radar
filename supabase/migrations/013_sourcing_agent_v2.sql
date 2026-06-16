-- ============================================================
-- SOURCING agent v2 : cache, drafts enrichis, settings, metrics
-- ============================================================

alter table public.opportunity_drafts
  add column if not exists invalid_urls jsonb not null default '[]',
  add column if not exists verification_level text not null default 'none'
    check (verification_level in ('none', 'partial', 'full')),
  add column if not exists needs_review boolean not null default false,
  add column if not exists fact_confidence text
    check (fact_confidence is null or fact_confidence in ('low', 'medium', 'high')),
  add column if not exists premium_verified boolean,
  add column if not exists rejection_reason text;

alter table public.sourcing_settings
  add column if not exists discovery_model text,
  add column if not exists structure_model text;

alter table public.sourcing_schedules
  add column if not exists config jsonb not null default '{}';

create table if not exists public.sourcing_discover_cache (
  id              uuid primary key default gen_random_uuid(),
  cache_key       text not null unique,
  country_code    text not null,
  sector          text,
  leads           jsonb not null default '[]',
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_sourcing_discover_cache_expires
  on public.sourcing_discover_cache (expires_at);

alter table public.sourcing_discover_cache enable row level security;

create policy "sourcing_discover_cache service-role uniquement"
  on public.sourcing_discover_cache for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create table if not exists public.sourcing_metrics_daily (
  day             date primary key default current_date,
  runs_total      integer not null default 0,
  runs_empty      integer not null default 0,
  drafts_written  integer not null default 0,
  drafts_verified integer not null default 0,
  cost_usd        numeric(10,4) not null default 0,
  skip_reasons    jsonb not null default '{}',
  updated_at      timestamptz not null default now()
);

alter table public.sourcing_metrics_daily enable row level security;

create policy "sourcing_metrics_daily service-role uniquement"
  on public.sourcing_metrics_daily for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
