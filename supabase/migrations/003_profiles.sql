-- ============================================================
-- TABLE : profiles (1 ligne par utilisateur auth.users)
-- ============================================================
create table if not exists public.profiles (
  id                              uuid primary key references auth.users(id) on delete cascade,
  email                           text,
  full_name                       text,
  plan                            text not null default 'free'
                                    check (plan in ('free','builder','pro')),
  is_admin                        boolean not null default false,
  opportunities_viewed_this_month integer not null default 0,
  last_reset_at                   timestamptz not null default now(),
  created_at                      timestamptz not null default now()
);

-- ============================================================
-- TRIGGER : creation automatique du profil a l'inscription
-- ------------------------------------------------------------
-- SECURITY DEFINER : la fonction s'execute avec les droits du proprietaire
-- (postgres) et CONTOURNE la RLS de profiles. Sans cela, l'INSERT depuis le
-- contexte du nouvel utilisateur est refuse par la RLS et Supabase renvoie
-- "Database error saving new user" -> tout signup casse.
-- set search_path = '' : evite le hijacking de schema (bonne pratique SECURITY DEFINER).
-- on conflict do nothing : idempotent si le profil existe deja.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RLS : l'utilisateur lit/maj SON profil, mais ne peut PAS
-- modifier plan ni is_admin (reserves au service-role).
-- ============================================================
alter table public.profiles enable row level security;

create policy "Profil : lecture par le proprietaire"
  on public.profiles for select
  using (auth.uid() = id);

-- Update limite : la ligne reste la sienne ET plan/is_admin inchanges.
-- (Toute elevation de privilege passe par le service-role, hors RLS.)
create policy "Profil : maj limitee par le proprietaire"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and plan = (select p.plan from public.profiles p where p.id = auth.uid())
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );

-- Acces total service-role (sourcing, attribution de plan, admin).
create policy "Profil : service-role total"
  on public.profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
