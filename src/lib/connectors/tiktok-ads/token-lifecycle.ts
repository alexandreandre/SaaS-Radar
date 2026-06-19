const DEFAULT_EXPIRY_BUFFER_MS = 60_000;
const REFRESH_WINDOW_MS = 60 * 60 * 1000;

export function isAccessTokenExpired(
  accessTokenExpiresAt: string,
  bufferMs = DEFAULT_EXPIRY_BUFFER_MS,
): boolean {
  const expiresAt = new Date(accessTokenExpiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt <= Date.now() + bufferMs;
}

export function shouldRefreshAccessToken(
  accessTokenExpiresAt: string,
  refreshWindowMs = REFRESH_WINDOW_MS,
): boolean {
  const expiresAt = new Date(accessTokenExpiresAt).getTime();
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt <= Date.now() + refreshWindowMs;
}
