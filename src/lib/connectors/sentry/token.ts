export function isSentryTokenExpired(expiresAt: string, skewMs = 5 * 60 * 1000): boolean {
  const at = new Date(expiresAt).getTime();
  if (Number.isNaN(at)) return true;
  return Date.now() + skewMs >= at;
}
