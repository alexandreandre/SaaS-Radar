/**
 * Tests unitaires de la détection logo produit (sans réseau).
 * Exécution : npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MANIFEST_CANDIDATES,
  REPO_LOGO_CANDIDATES,
  parseHtmlIconLinks,
  parseManifestIcons,
  pickLogoCandidate,
  shouldUpdateProductLogo,
} from "../src/lib/build/product-logo";

test("REPO_LOGO_CANDIDATES privilégie app/icon avant favicon racine", () => {
  const appIconIndex = REPO_LOGO_CANDIDATES.indexOf("app/icon.png");
  const faviconIndex = REPO_LOGO_CANDIDATES.indexOf("favicon.ico");
  assert.ok(appIconIndex >= 0);
  assert.ok(faviconIndex >= 0);
  assert.ok(appIconIndex < faviconIndex);
});

test("MANIFEST_CANDIDATES inclut site.webmanifest", () => {
  assert.ok(MANIFEST_CANDIDATES.includes("public/site.webmanifest"));
});

test("pickLogoCandidate retourne le premier candidat non vide", () => {
  assert.equal(pickLogoCandidate(["", "  ", "https://cdn/logo.png"]), "https://cdn/logo.png");
  assert.equal(pickLogoCandidate([]), null);
});

test("parseHtmlIconLinks choisit la plus grande icône", () => {
  const html = `
    <head>
      <link rel="icon" href="/favicon-32.png" sizes="32x32" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
    </head>
  `;
  const url = parseHtmlIconLinks(html, "https://app.example.com");
  assert.equal(url, "https://app.example.com/apple-touch-icon.png");
});

test("parseHtmlIconLinks résout les URLs relatives depuis la racine", () => {
  const html = `<link rel="shortcut icon" href="/assets/logo.svg" />`;
  const url = parseHtmlIconLinks(html, "https://demo.vercel.app/page");
  assert.equal(url, "https://demo.vercel.app/assets/logo.svg");
});

test("parseManifestIcons choisit la plus grande entrée icons", () => {
  const manifest = {
    icons: [
      { src: "icon-192.png", sizes: "192x192" },
      { src: "icon-512.png", sizes: "512x512" },
    ],
  };
  const url = parseManifestIcons(manifest, "https://raw.githubusercontent.com/o/r/main/public/");
  assert.equal(
    url,
    "https://raw.githubusercontent.com/o/r/main/public/icon-512.png",
  );
});

test("shouldUpdateProductLogo respecte host > github", () => {
  const githubLogo = {
    url: "https://raw.githubusercontent.com/o/r/main/public/logo.png",
    source: "github" as const,
    detectedAt: "2026-01-01T00:00:00.000Z",
  };
  const hostLogo = {
    url: "https://app.example.com/favicon.ico",
    source: "host" as const,
    detectedAt: "2026-01-02T00:00:00.000Z",
  };

  assert.equal(shouldUpdateProductLogo(undefined, githubLogo), true);
  assert.equal(shouldUpdateProductLogo(githubLogo, hostLogo), true);
  assert.equal(shouldUpdateProductLogo(hostLogo, githubLogo), false);
  assert.equal(shouldUpdateProductLogo(githubLogo, githubLogo), true);
});
