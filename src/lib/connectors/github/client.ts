import "server-only";

import { createSign } from "crypto";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";

export class GitHubConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GitHubConnectorError";
    this.status = status;
  }
}

function getAppId(): string | null {
  return process.env.GITHUB_APP_ID ?? null;
}

function getPrivateKey(): string | null {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!raw) return null;
  return raw.includes("BEGIN") ? raw.replace(/\\n/g, "\n") : Buffer.from(raw, "base64").toString("utf8");
}

export function isGitHubAppConfigured(): boolean {
  return Boolean(getAppId() && getPrivateKey());
}

function createAppJwt(): string {
  const appId = getAppId();
  const privateKey = getPrivateKey();
  if (!appId || !privateKey) {
    throw new GitHubConnectorError("GitHub App non configurée", 503);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now - 60, exp: now + 600, iss: appId };
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${header}.${body}`;
  const sign = createSign("RSA-SHA256");
  sign.update(data);
  sign.end();
  const signature = sign.sign(privateKey, "base64url");
  return `${data}.${signature}`;
}

export function getGitHubInstallUrl(state: string): string | null {
  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) return null;
  return `https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state)}`;
}

export async function getInstallationAccessToken(installationId: number): Promise<string> {
  const jwt = createAppJwt();
  const res = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
    },
  });

  if (!res.ok) {
    void (await res.text());
    throw new GitHubConnectorError(
      `Impossible d'obtenir un token d'installation GitHub (${res.status})`,
      res.status,
    );
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}

function githubErrorMessage(status: number, path: string): string {
  if (status === 403) {
    return `Accès refusé sur ${path} — vérifiez les permissions de l'app GitHub sur ce dépôt.`;
  }
  if (status === 404) {
    return `Ressource introuvable (${path}) — le dépôt est peut-être hors du périmètre d'installation.`;
  }
  if (status === 429) {
    return "Limite de requêtes GitHub atteinte — réessayez dans quelques minutes.";
  }
  return `Erreur API GitHub (${status}) sur ${path}`;
}

export async function ghFetch<T>(
  token: string,
  path: string,
  options?: { allow202?: boolean },
): Promise<T | null> {
  const maxAttempts = options?.allow202 ? 4 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(`${GITHUB_API}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
      },
      next: { revalidate: 0 },
    });

    if (res.status === 202 && options?.allow202 && attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }

    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) {
      throw new GitHubConnectorError(githubErrorMessage(res.status, path), res.status);
    }

    return res.json() as Promise<T>;
  }

  return null;
}

export async function ghFetchPaginated<T>(
  token: string,
  path: string,
  perPage = 100,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const separator = path.includes("?") ? "&" : "?";
    const pagePath = `${path}${separator}per_page=${perPage}&page=${page}`;
    const res = await fetch(`${GITHUB_API}${pagePath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": API_VERSION,
      },
      next: { revalidate: 0 },
    });

    if (res.status === 404 || res.status === 403) break;
    if (!res.ok) {
      throw new GitHubConnectorError(githubErrorMessage(res.status, pagePath), res.status);
    }

    const batch = (await res.json()) as T[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return items;
}
