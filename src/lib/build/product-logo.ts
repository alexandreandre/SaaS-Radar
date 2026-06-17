import type { ProductLogo } from "@/lib/portfolio";

export const REPO_LOGO_CANDIDATES = [
  "app/icon.png",
  "app/apple-icon.png",
  "public/logo.png",
  "public/logo.svg",
  "public/favicon.ico",
  "src/app/icon.png",
  "favicon.ico",
] as const;

export const MANIFEST_CANDIDATES = [
  "public/site.webmanifest",
  "public/manifest.webmanifest",
  "app/manifest.json",
] as const;

export function pickLogoCandidate(candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function shouldUpdateProductLogo(
  current: ProductLogo | undefined,
  incoming: ProductLogo,
): boolean {
  if (!current) return true;
  if (incoming.source === "host") return true;
  if (current.source === "host") return false;
  return incoming.source === "github";
}

export function buildProductLogo(url: string, source: ProductLogo["source"]): ProductLogo {
  return { url, source, detectedAt: new Date().toISOString() };
}

export function parseHtmlIconLinks(html: string, baseUrl: string): string | null {
  const relPattern =
    /<link[^>]+rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*>/gi;
  const hrefPattern = /href=["']([^"']+)["']/i;
  const sizesPattern = /sizes=["']([^"']+)["']/i;

  type Candidate = { url: string; size: number };
  const candidates: Candidate[] = [];

  for (const tag of html.match(relPattern) ?? []) {
    const hrefMatch = tag.match(hrefPattern);
    if (!hrefMatch?.[1]) continue;
    const resolved = resolveAssetUrl(hrefMatch[1], baseUrl);
    if (!resolved) continue;
    const sizesMatch = tag.match(sizesPattern);
    const size = parseIconSize(sizesMatch?.[1] ?? "32x32");
    candidates.push({ url: resolved, size });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.size - a.size);
  return candidates[0]?.url ?? null;
}

export function parseManifestIcons(manifest: unknown, baseUrl: string): string | null {
  if (!manifest || typeof manifest !== "object") return null;
  const icons = (manifest as { icons?: unknown }).icons;
  if (!Array.isArray(icons)) return null;

  type Candidate = { url: string; size: number };
  const candidates: Candidate[] = [];

  for (const icon of icons) {
    if (!icon || typeof icon !== "object") continue;
    const src = (icon as { src?: unknown }).src;
    if (typeof src !== "string" || !src.trim()) continue;
    const resolved = resolveAssetUrl(src.trim(), baseUrl);
    if (!resolved) continue;
    const sizes = (icon as { sizes?: unknown }).sizes;
    const size =
      typeof sizes === "string" ? parseIconSize(sizes.split(/\s+/)[0] ?? "32x32") : 32;
    candidates.push({ url: resolved, size });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.size - a.size);
  return candidates[0]?.url ?? null;
}

function resolveAssetUrl(href: string, baseUrl: string): string | null {
  try {
    if (href.startsWith("data:")) return null;
    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("http://") || href.startsWith("https://")) return href;
    const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    if (href.startsWith("/")) {
      const origin = new URL(baseUrl).origin;
      return `${origin}${href}`;
    }
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function parseIconSize(value: string): number {
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1] ?? "32", 10) : 32;
}
