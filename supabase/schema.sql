-- Extensions
create extension if not exists "uuid-ossp";

-- ENUM types
create type sector_type as enum (
  'healthcare', 'construction', 'hr', 'finance',
  'legal', 'retail', 'education', 'hospitality'
);
create type client_type as enum ('b2b', 'b2c');
create type tech_complexity as enum ('low', 'medium', 'high');
create type france_competition as enum ('none', 'low', 'medium', 'high');
create type trend_direction as enum ('rising', 'stable', 'emerging', 'cooling');
create type market_scope as enum ('priority', 'active', 'emerging', 'watch');
create type user_plan as enum ('free', 'builder', 'pro');

-- Table : opportunités
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  pitch text not null,
  origin_country text not null,
  origin_country_code text not null,
  origin_flag text not null,
  sector sector_type not null,
  target_client text not null,
  client_type client_type not null,
  tech_complexity tech_complexity not null,
  france_competition france_competition not null,
  revenue_min integer not null default 0,
  revenue_max integer not null default 0,
  buildable_under_30_days boolean default false,
  boring_business boolean default false,
  ai_powered boolean default false,
  low_competition boolean default false,
  -- Scores (jsonb pour flexibilité)
  scores jsonb not null default '{}',
  -- France fit criteria
  france_fit_criteria jsonb not null default '{}',
  -- Traction signals
  traction_signals jsonb not null default '[]',
  -- Why it works
  why_it_works jsonb not null default '[]',
  -- France analysis
  france_analysis jsonb not null default '[]',
  -- Financial scenarios
  financial_scenarios jsonb not null default '[]',
  -- CAC channels
  cac_channels jsonb not null default '[]',
  -- MVP plan
  mvp_plan jsonb not null default '{}',
  -- Claude prompt (premium)
  claude_prompt text,
  -- Acquisition tabs
  acquisition jsonb not null default '[]',
  -- Stats
  entrepreneurs_building integer default 0,
  foreign_inspiration text,
  -- Weekly pick
  weekly_pick boolean default false,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_opportunities_slug on opportunities(slug);
create index idx_opportunities_sector on opportunities(sector);
create index idx_opportunities_weekly on opportunities(weekly_pick) where weekly_pick = true;

-- Table : marchés mondiaux
create table world_markets (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  flag text not null,
  scope market_scope not null default 'watch',
  heat_score integer not null default 0,
  tracked_micro_saas integer default 0,
  new_this_month integer default 0,
  avg_top_mrr_usd integer default 0,
  trend trend_direction not null default 'stable',
  trends jsonb not null default '[]',
  top_earners jsonb not null default '[]',
  opportunity_slugs jsonb not null default '[]',
  insight text,
  updated_at timestamptz default now()
);

create index idx_world_markets_code on world_markets(code);
create index idx_world_markets_heat on world_markets(heat_score desc);

-- Table : profils utilisateurs
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  plan user_plan default 'free',
  opportunities_viewed_this_month integer default 0,
  last_reset_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Table : watchlist utilisateurs
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, opportunity_id)
);

-- Table : waitlist (landing)
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text,
  created_at timestamptz default now()
);

-- RLS
alter table opportunities enable row level security;
alter table world_markets enable row level security;
alter table profiles enable row level security;
alter table watchlist enable row level security;
alter table waitlist enable row level security;

-- Policies
create policy "Opportunities lisibles par tous"
  on opportunities for select using (true);

create policy "World markets lisibles par tous"
  on world_markets for select using (true);

create policy "Profiles : user voit son profil"
  on profiles for select using (auth.uid() = id);

create policy "Profiles : user modifie son profil"
  on profiles for update using (auth.uid() = id);

create policy "Watchlist : user gère sa liste"
  on watchlist for all using (auth.uid() = user_id);

create policy "Waitlist : insert public"
  on waitlist for insert with check (true);
