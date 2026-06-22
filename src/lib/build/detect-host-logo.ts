import "server-only";

import { faviconUrl } from "@/lib/build/brands";
import { parseHtmlIconLinks } from "@/lib/build/product-logo";

const FETCH_TIMEOUT_MS = 3000;
const HTML_BYTE_LIMIT = 32 * 1024;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function urlLooksLikeImage(url: string): Promise<boolean> {
  const res = await fetchWithTimeout(url, { method: "HEAD" });
  if (!res?.ok) {
    const getRes = await fetchWithTimeout(url, { method: "GET" });
    if (!getRes?.ok) return false;
    const type = getRes.headers.get("content-type") ?? "";
    return type.startsWith("image/") || type.includes("svg");
  }
  const type = res.headers.get("content-type") ?? "";
  return type.startsWith("image/") || type.includes("svg") || url.endsWith(".ico");
}

export async function detectHostLogo(productionUrl: string): Promise<string | null> {
  let origin: string;
  try {
    origin = new URL(productionUrl).origin;
  } catch {
    return null;
  }

  const faviconCandidates = [`${origin}/favicon.ico`, `${origin}/favicon.png`, `${origin}/apple-touch-icon.png`];
  for (const candidate of faviconCandidates) {
    if (await urlLooksLikeImage(candidate)) return candidate;
  }

  const pageRes = await fetchWithTimeout(productionUrl, {
    headers: { Accept: "text/html", "User-Agent": "The-Build-Road-LogoBot/1.0" },
  });
  if (pageRes?.ok) {
    const buffer = await pageRes.arrayBuffer();
    const html = new TextDecoder("utf-8").decode(buffer.slice(0, HTML_BYTE_LIMIT));
    const fromHtml = parseHtmlIconLinks(html, productionUrl);
    if (fromHtml && (await urlLooksLikeImage(fromHtml))) return fromHtml;
  }

  try {
    const domain = new URL(productionUrl).hostname;
    return faviconUrl(domain, 128);
  } catch {
    return null;
  }
}
