-- Étendre les providers connecteurs pour Stripe (comptes utilisateurs)
alter table public.connector_credentials
  drop constraint if exists connector_credentials_provider_check;

alter table public.connector_credentials
  add constraint connector_credentials_provider_check
  check (provider in ('github', 'vercel', 'netlify', 'stripe'));
