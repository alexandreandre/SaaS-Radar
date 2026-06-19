-- Étendre les providers connecteurs pour TikTok Ads (OAuth advertiser)
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
      'plausible',
      'loops',
      'lemon-squeezy'
    )
  );
