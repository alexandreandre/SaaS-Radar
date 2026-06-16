-- ============================================================
-- WORLD MARKETS : table editable pour la carte admin
-- ============================================================

create table if not exists public.world_markets (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  name                text not null,
  flag                text not null,
  scope               text not null default 'watch'
                        check (scope in ('priority','active','emerging','watch')),
  heat_score          integer not null default 0,
  tracked_micro_saas  integer not null default 0,
  new_this_month      integer not null default 0,
  avg_top_mrr_usd     integer not null default 0,
  trend               text not null default 'stable'
                        check (trend in ('rising','stable','emerging','cooling')),
  trends              jsonb not null default '[]',
  top_earners         jsonb not null default '[]',
  opportunity_slugs   jsonb not null default '[]',
  insight             text,
  is_manual_override  boolean not null default false,
  updated_at          timestamptz not null default now()
);

create index if not exists idx_world_markets_code
  on public.world_markets (code);

create index if not exists idx_world_markets_heat
  on public.world_markets (heat_score desc);

alter table public.world_markets enable row level security;

create policy "world_markets lecture publique"
  on public.world_markets for select
  using (true);

create policy "world_markets service-role ecriture"
  on public.world_markets for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- COCKPIT (optionnel) : projets utilisateur serveur
-- ============================================================
create table if not exists public.user_projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  opportunity_slug text,
  name            text not null,
  phase           text not null default 'build'
                    check (phase in ('build','launch','revenue','paused')),
  mrr_cents       integer not null default 0,
  payload         jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_user_projects_user
  on public.user_projects (user_id, updated_at desc);

create table if not exists public.connector_snapshots (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.user_projects(id) on delete cascade,
  connector_id    text not null,
  status          text not null default 'demo',
  payload         jsonb not null default '{}',
  synced_at       timestamptz not null default now()
);

alter table public.user_projects enable row level security;
alter table public.connector_snapshots enable row level security;

create policy "user_projects owner"
  on public.user_projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_projects service-role total"
  on public.user_projects for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "connector_snapshots service-role total"
  on public.connector_snapshots for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- ADMIN SESSIONS (P4 : alertes connexion admin)
-- ============================================================
create table if not exists public.admin_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ip_address    text,
  user_agent    text,
  auth_method   text not null default 'password',
  is_trusted    boolean not null default false,
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists idx_admin_sessions_user
  on public.admin_sessions (user_id, last_seen_at desc);

alter table public.admin_sessions enable row level security;

create policy "admin_sessions service-role uniquement"
  on public.admin_sessions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
