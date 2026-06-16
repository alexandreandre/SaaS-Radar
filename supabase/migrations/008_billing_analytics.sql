-- ============================================================
-- BILLING ANALYTICS : price_id sur profiles + snapshots
-- ============================================================

alter table public.profiles
  add column if not exists stripe_price_id text,
  add column if not exists billing_interval text
    check (billing_interval is null or billing_interval in ('month','year'));

-- ============================================================
-- RLS : verrouiller les nouvelles colonnes billing
-- ============================================================
drop policy if exists "Profil : maj limitee par le proprietaire" on public.profiles;

create policy "Profil : maj limitee par le proprietaire"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and plan = (select p.plan from public.profiles p where p.id = auth.uid())
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
    and admin_role = (select p.admin_role from public.profiles p where p.id = auth.uid())
    and stripe_customer_id is not distinct from
        (select p.stripe_customer_id from public.profiles p where p.id = auth.uid())
    and stripe_subscription_id is not distinct from
        (select p.stripe_subscription_id from public.profiles p where p.id = auth.uid())
    and subscription_status is not distinct from
        (select p.subscription_status from public.profiles p where p.id = auth.uid())
    and current_period_end is not distinct from
        (select p.current_period_end from public.profiles p where p.id = auth.uid())
    and stripe_price_id is not distinct from
        (select p.stripe_price_id from public.profiles p where p.id = auth.uid())
    and billing_interval is not distinct from
        (select p.billing_interval from public.profiles p where p.id = auth.uid())
  );

create table if not exists public.billing_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  snapshot_date       date not null unique,
  mrr_cents           integer not null default 0,
  arr_cents           integer not null default 0,
  active_subscribers  integer not null default 0,
  free_count          integer not null default 0,
  builder_count       integer not null default 0,
  pro_count           integer not null default 0,
  past_due_count      integer not null default 0,
  churn_count         integer not null default 0,
  metadata            jsonb not null default '{}',
  created_at          timestamptz not null default now()
);

create index if not exists idx_billing_snapshots_date
  on public.billing_snapshots (snapshot_date desc);

alter table public.billing_snapshots enable row level security;

create policy "billing_snapshots service-role uniquement"
  on public.billing_snapshots for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
