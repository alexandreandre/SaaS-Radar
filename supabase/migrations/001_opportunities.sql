-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE : opportunities
-- ============================================================
create table if not exists public.opportunities (

  -- Identifiants
  id                      text primary key,
  slug                    text unique not null,

  -- Contenu principal
  name                    text not null,
  pitch                   text not null,
  origin_country          text not null,
  origin_country_code     text not null,
  origin_flag             text not null,
  sector                  text not null check (sector in (
                            'healthcare','construction','hr','finance',
                            'legal','retail','education','hospitality')),
  target_client           text not null,
  client_type             text not null check (client_type in ('b2b','b2c')),
  tech_complexity         text not null check (tech_complexity in ('low','medium','high')),
  france_competition      text not null check (france_competition in ('none','low','medium','high')),

  -- Revenus estimés
  revenue_min             integer not null,
  revenue_max             integer not null,

  -- Flags booléens
  buildable_under_30_days boolean not null default false,
  boring_business         boolean not null default false,
  ai_powered              boolean not null default false,
  low_competition         boolean not null default false,
  weekly_pick             boolean not null default false,

  -- Scalaires divers
  entrepreneurs_building  integer not null default 0,
  foreign_inspiration     text not null default '',
  claude_prompt           text not null default '',
  url                     text,
  created_at              timestamptz not null default now(),

  -- Objets imbriqués → jsonb
  scores                  jsonb not null default '{}',
  france_fit_criteria     jsonb not null default '{}',

  -- Arrays d'objets complexes → jsonb
  traction_signals        jsonb not null default '[]',
  why_it_works            jsonb not null default '[]',
  france_analysis         jsonb not null default '[]',
  financial_scenarios     jsonb not null default '[]',
  cac_channels            jsonb not null default '[]',
  acquisition             jsonb not null default '[]',
  mvp_plan                jsonb not null default '{}',

  -- Champs optionnels
  foreign_market_profile  jsonb,
  infra_costs             jsonb,
  french_competitors      jsonb,
  launch_timeline         jsonb,
  email_templates         jsonb,
  partners_fr             jsonb,
  roi_inputs              jsonb,
  tam_breakdown           jsonb,
  competition_alerts      jsonb
);

-- Index utiles pour les filtres de la page /opportunities
create index if not exists idx_opportunities_sector
  on public.opportunities(sector);
create index if not exists idx_opportunities_weekly_pick
  on public.opportunities(weekly_pick);
create index if not exists idx_opportunities_score
  on public.opportunities((scores->>'opportunity'));
create index if not exists idx_opportunities_country
  on public.opportunities(origin_country_code);
create index if not exists idx_opportunities_created_at
  on public.opportunities(created_at desc);

-- RLS : lecture publique, écriture service-role uniquement
alter table public.opportunities enable row level security;

create policy "Lecture publique"
  on public.opportunities for select
  using (true);

create policy "Écriture service-role uniquement"
  on public.opportunities for all
  using (auth.role() = 'service_role');
