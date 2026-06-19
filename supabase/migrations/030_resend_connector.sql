-- Étendre les providers connecteurs pour Resend (clé API + webhooks Svix)
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
      'microsoft-ads',
      'plausible',
      'loops',
      'lemon-squeezy',
      'brevo',
      'crisp',
      'paddle',
      'freemius',
      'posthog',
      'resend'
    )
  );

-- Autoriser les événements webhook Resend (email.clicked, contact.created)
alter table public.connector_webhook_events
  drop constraint if exists connector_webhook_events_provider_check;

alter table public.connector_webhook_events
  add constraint connector_webhook_events_provider_check
  check (provider in ('loops', 'brevo', 'resend'));
