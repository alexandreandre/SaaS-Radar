import "server-only";

const MICROSOFT_SCOPE = "openid offline_access https://ads.microsoft.com/msads.manage";
const GOOGLE_SCOPE = "profile email";
const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type MicrosoftAdsOAuthProvider = "microsoft" | "google";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} manquant`);
  return value;
}

function getTenant(): string {
  return process.env.MICROSOFT_ADS_TENANT?.trim() || "common";
}

function getMicrosoftTokenUrl(): string {
  const tenant = getTenant();
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
}

function getMicrosoftAuthorizeUrlBase(): string {
  const tenant = getTenant();
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`;
}

export function isMicrosoftAdsMicrosoftOAuthConfigured(): boolean {
  return !!(
    process.env.MICROSOFT_ADS_CLIENT_ID?.trim() &&
    process.env.MICROSOFT_ADS_CLIENT_SECRET?.trim() &&
    process.env.MICROSOFT_ADS_REDIRECT_URI?.trim()
  );
}

export function isMicrosoftAdsGoogleOAuthConfigured(): boolean {
  return !!(
    process.env.MICROSOFT_ADS_GOOGLE_CLIENT_ID?.trim() &&
    process.env.MICROSOFT_ADS_GOOGLE_CLIENT_SECRET?.trim() &&
    process.env.MICROSOFT_ADS_REDIRECT_URI?.trim()
  );
}

export function isMicrosoftAdsOAuthConfigured(provider: MicrosoftAdsOAuthProvider): boolean {
  return provider === "google"
    ? isMicrosoftAdsGoogleOAuthConfigured()
    : isMicrosoftAdsMicrosoftOAuthConfigured();
}

export function getMicrosoftAdsAuthorizeUrl(
  state: string,
  provider: MicrosoftAdsOAuthProvider,
): string {
  const redirectUri = requireEnv("MICROSOFT_ADS_REDIRECT_URI");

  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: requireEnv("MICROSOFT_ADS_GOOGLE_CLIENT_ID"),
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPE,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: requireEnv("MICROSOFT_ADS_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: MICROSOFT_SCOPE,
    state,
    prompt: "select_account",
  });
  return `${getMicrosoftAuthorizeUrlBase()}?${params.toString()}`;
}

async function postTokenRequest(url: string, body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  let data: TokenResponse;
  try {
    data = (await res.json()) as TokenResponse;
  } catch {
    throw new Error("Réponse OAuth Microsoft Ads invalide");
  }

  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? "Échange de token Microsoft Ads échoué");
  }

  if (!data.access_token) {
    throw new Error("Access token Microsoft Ads manquant dans la réponse OAuth");
  }

  return data;
}

export async function exchangeMicrosoftAdsCode(
  code: string,
  provider: MicrosoftAdsOAuthProvider,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const redirectUri = requireEnv("MICROSOFT_ADS_REDIRECT_URI");

  if (provider === "google") {
    const body = new URLSearchParams({
      code,
      client_id: requireEnv("MICROSOFT_ADS_GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("MICROSOFT_ADS_GOOGLE_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    const data = await postTokenRequest(GOOGLE_TOKEN_URL, body);
    return {
      accessToken: data.access_token!,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in ?? 3600,
    };
  }

  const body = new URLSearchParams({
    code,
    client_id: requireEnv("MICROSOFT_ADS_CLIENT_ID"),
    client_secret: requireEnv("MICROSOFT_ADS_CLIENT_SECRET"),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    scope: "https://ads.microsoft.com/msads.manage offline_access",
  });
  const data = await postTokenRequest(getMicrosoftTokenUrl(), body);
  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

export async function refreshMicrosoftAdsAccessToken(
  refreshToken: string,
  provider: MicrosoftAdsOAuthProvider,
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  if (provider === "google") {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv("MICROSOFT_ADS_GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("MICROSOFT_ADS_GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token",
    });
    const data = await postTokenRequest(GOOGLE_TOKEN_URL, body);
    return {
      accessToken: data.access_token!,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresIn: data.expires_in ?? 3600,
    };
  }

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: requireEnv("MICROSOFT_ADS_CLIENT_ID"),
    client_secret: requireEnv("MICROSOFT_ADS_CLIENT_SECRET"),
    grant_type: "refresh_token",
    scope: "https://ads.microsoft.com/msads.manage offline_access",
  });
  const data = await postTokenRequest(getMicrosoftTokenUrl(), body);
  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresIn: data.expires_in ?? 3600,
  };
}

export function buildAccessTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

export function oauthProviderToIdentity(
  provider: MicrosoftAdsOAuthProvider,
): "Microsoft" | "Google" {
  return provider === "google" ? "Google" : "Microsoft";
}
