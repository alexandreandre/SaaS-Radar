-- Étendre les providers connecteurs pour PostHog (Personal API Key utilisateur)
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
      'posthog'
    )
  );
