-- Étendre les providers connecteurs pour Brevo (clé API + webhooks marketing)
alter table public.connector_credentials
  drop constraint if exists connector_credentials_provider_check;

alter table public.connector_credentials
  add constraint connector_credentials_provider_check
  check (
    provider in (
      'github',
      'vercel',
      'netlify',
      'stripe',
      'google-ads',
      'meta-ads',
      'tiktok-ads',
      'linkedin-ads',
      'plausible',
      'loops',
      'lemon-squeezy',
      'brevo'
    )
  );

-- Autoriser les événements webhook Brevo (list_addition, click)
alter table public.connector_webhook_events
  drop constraint if exists connector_webhook_events_provider_check;

alter table public.connector_webhook_events
  add constraint connector_webhook_events_provider_check
  check (provider in ('loops', 'brevo'));
