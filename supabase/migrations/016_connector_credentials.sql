-- Credentials connecteurs (tokens chiffrés côté serveur, jamais exposés au client)
create table if not exists public.connector_credentials (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid not null references public.user_projects(id) on delete cascade,
  provider            text not null check (provider in ('github', 'vercel', 'netlify')),
  credential_encrypted text not null,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (project_id, provider)
);

create index if not exists idx_connector_credentials_user
  on public.connector_credentials (user_id, updated_at desc);

alter table public.connector_credentials enable row level security;

create policy "connector_credentials owner read"
  on public.connector_credentials for select
  using (auth.uid() = user_id);

create policy "connector_credentials service-role total"
  on public.connector_credentials for all
  using (auth.role() = 'service_role');
