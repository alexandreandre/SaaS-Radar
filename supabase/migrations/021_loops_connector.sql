-- Étendre les providers connecteurs pour Loops (clé API + webhooks utilisateur)
alter table public.connector_credentials
  drop constraint if exists connector_credentials_provider_check;

alter table public.connector_credentials
  add constraint connector_credentials_provider_check
  check (provider in ('github', 'vercel', 'netlify', 'stripe', 'google-ads', 'meta-ads', 'plausible', 'loops'));

-- Événements webhook ingérés pour agrégation métriques (service role write)
create table if not exists public.connector_webhook_events (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.user_projects(id) on delete cascade,
  provider        text not null check (provider = 'loops'),
  event_id        text not null,
  event_name      text not null,
  event_time      timestamptz not null,
  contact_id      text,
  mailing_list_id text,
  payload         jsonb not null,
  created_at      timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists idx_webhook_events_project_time
  on public.connector_webhook_events (project_id, provider, event_time desc);

alter table public.connector_webhook_events enable row level security;

create policy "connector_webhook_events service-role total"
  on public.connector_webhook_events for all
  using (auth.role() = 'service_role');
