export type VercelRedirectEnv = {
  VERCEL_REDIRECT_URI?: string;
  NEXT_PUBLIC_APP_URL?: string;
};

export function resolveVercelRedirectUri(env: VercelRedirectEnv): string | null {
  const explicit = env.VERCEL_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const base = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return base ? `${base}/api/connectors/vercel/callback` : null;
}
