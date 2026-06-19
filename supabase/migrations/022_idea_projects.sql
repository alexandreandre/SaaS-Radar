-- Projets issus du parcours idée (opportunity_slug nullable, payload JSONB enrichi)
comment on column public.user_projects.opportunity_slug is
  'Slug catalogue ; NULL ou vide pour projets idée / GitHub (projectSource dans payload)';
