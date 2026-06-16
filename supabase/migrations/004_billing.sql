-- ============================================================
-- BILLING : colonnes Stripe sur profiles + idempotence webhook
-- ============================================================

alter table public.profiles
  add column if not exists stripe_customer_id     text unique,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status    text,
  add column if not exists current_period_end     timestamptz;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id);

-- ============================================================
-- RLS : verrouiller les colonnes de facturation cote utilisateur.
-- L'utilisateur peut maj son profil (full_name, quota...) mais NI `plan`,
-- NI `is_admin`, NI aucune colonne `stripe_*`/abonnement : seules ecrites
-- par le service-role (webhook Stripe). On remplace la policy de 003.
-- ============================================================
drop policy if exists "Profil : maj limitee par le proprietaire" on public.profiles;

create policy "Profil : maj limitee par le proprietaire"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and plan = (select p.plan from public.profiles p where p.id = auth.uid())
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
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
-- TABLE : stripe_events (idempotence du webhook)
-- Stripe peut renvoyer un meme event plusieurs fois : on enregistre
-- l'event.id traite pour ne pas appliquer deux fois la meme mutation.
-- ============================================================
create table if not exists public.stripe_events (
  id          text primary key,
  type        text,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

create policy "Stripe events : service-role total"
  on public.stripe_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
