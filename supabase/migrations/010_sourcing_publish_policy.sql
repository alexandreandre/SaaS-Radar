-- ============================================================
-- SOURCING : politique de publication + metadata brouillons
-- ============================================================

create table if not exists public.sourcing_settings (
  id                    text primary key default 'default',
  default_mode          text not null default 'draft'
                          check (default_mode in ('draft','direct')),
  auto_publish_enabled  boolean not null default false,
  auto_publish_rules    jsonb not null default '[]',
  notify_on_pending     boolean not null default false,
  monthly_cost_cap_usd  numeric(10,2),
  updated_by            uuid references auth.users(id) on delete set null,
  updated_at            timestamptz not null default now()
);

insert into public.sourcing_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.sourcing_settings enable row level security;

create policy "sourcing_settings service-role uniquement"
  on public.sourcing_settings for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

alter table public.opportunity_drafts
  add column if not exists source_lead jsonb,
  add column if not exists auto_publish_rule_id text,
  add column if not exists source_verified boolean default false;
