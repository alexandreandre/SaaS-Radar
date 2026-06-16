-- Favoris utilisateur (shortlist opportunités)
create table if not exists public.opportunity_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_slug text not null references public.opportunities(slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, opportunity_slug)
);

create index if not exists idx_opportunity_favorites_user
  on public.opportunity_favorites (user_id);

create index if not exists idx_opportunity_favorites_created
  on public.opportunity_favorites (user_id, created_at desc);

alter table public.opportunity_favorites enable row level security;

create policy "Favoris : lecture par le propriétaire"
  on public.opportunity_favorites for select
  using (auth.uid() = user_id);

create policy "Favoris : ajout par le propriétaire"
  on public.opportunity_favorites for insert
  with check (auth.uid() = user_id);

create policy "Favoris : suppression par le propriétaire"
  on public.opportunity_favorites for delete
  using (auth.uid() = user_id);
