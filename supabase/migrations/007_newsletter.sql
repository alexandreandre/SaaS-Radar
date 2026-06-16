-- ============================================================
-- NEWSLETTER : abonnés, campagnes, events
-- ============================================================

create table if not exists public.newsletter_subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             text unique not null,
  status            text not null default 'pending'
                      check (status in ('pending','active','unsubscribed','bounced')),
  source            text,
  unsubscribe_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  confirmed_at      timestamptz,
  unsubscribed_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_newsletter_subscribers_status
  on public.newsletter_subscribers (status, created_at desc);

create table if not exists public.newsletter_campaigns (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  subject       text not null,
  body_html     text,
  body_text     text,
  status        text not null default 'draft'
                  check (status in ('draft','scheduled','sent','cancelled')),
  scheduled_at  timestamptz,
  sent_at       timestamptz,
  recipient_count integer default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.newsletter_events (
  id              uuid primary key default gen_random_uuid(),
  subscriber_id   uuid references public.newsletter_subscribers(id) on delete cascade,
  campaign_id     uuid references public.newsletter_campaigns(id) on delete set null,
  event_type      text not null check (event_type in ('sent','open','click','bounce','unsubscribe')),
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_newsletter_events_type
  on public.newsletter_events (event_type, created_at desc);

alter table public.newsletter_subscribers enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.newsletter_events enable row level security;

-- Insert public pour le formulaire d'inscription
create policy "newsletter_subscribers insert public"
  on public.newsletter_subscribers for insert
  with check (true);

create policy "newsletter_subscribers service-role total"
  on public.newsletter_subscribers for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "newsletter_campaigns service-role total"
  on public.newsletter_campaigns for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "newsletter_events service-role total"
  on public.newsletter_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
