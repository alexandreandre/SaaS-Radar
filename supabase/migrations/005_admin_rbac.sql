-- ============================================================
-- ADMIN RBAC + audit log
-- ============================================================

alter table public.profiles
  add column if not exists admin_role text not null default 'none'
    check (admin_role in ('none','viewer','editor','owner'));

-- Compat : is_admin true -> owner
update public.profiles
set admin_role = 'owner'
where is_admin = true and admin_role = 'none';

create index if not exists profiles_admin_role_idx
  on public.profiles (admin_role)
  where admin_role <> 'none';

-- ============================================================
-- RLS : verrouiller admin_role cote utilisateur
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
  );

-- ============================================================
-- TABLE : admin_audit_log
-- ============================================================
create table if not exists public.admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references auth.users(id) on delete set null,
  actor_email   text,
  action        text not null,
  target_type   text,
  target_id     text,
  ip_address    text,
  user_agent    text,
  before_state  jsonb,
  after_state   jsonb,
  metadata      jsonb not null default '{}',
  created_at    timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created_at
  on public.admin_audit_log (created_at desc);

create index if not exists idx_admin_audit_log_actor
  on public.admin_audit_log (actor_id, created_at desc);

alter table public.admin_audit_log enable row level security;

create policy "admin_audit_log service-role uniquement"
  on public.admin_audit_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- TABLE : admin_rate_limits (fallback sans Redis)
-- ============================================================
create table if not exists public.admin_rate_limits (
  key         text not null,
  window_start timestamptz not null,
  count       integer not null default 1,
  primary key (key, window_start)
);

alter table public.admin_rate_limits enable row level security;

create policy "admin_rate_limits service-role uniquement"
  on public.admin_rate_limits for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
