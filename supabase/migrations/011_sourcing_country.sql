-- ============================================================
-- SOURCING : ciblage par pays (run = 1 pays)
-- ============================================================

alter table public.sourcing_runs
  add column if not exists origin_country_code text;

create index if not exists idx_sourcing_runs_country_started
  on public.sourcing_runs (origin_country_code, started_at desc);

alter table public.sourcing_schedules
  add column if not exists country_codes text[] not null default '{US}';

update public.sourcing_schedules
set country_codes = '{US}'
where country_codes is null or cardinality(country_codes) = 0;
