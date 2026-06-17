import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { buildSnapshotsFromAnalytics } from "../src/lib/connectors/stripe/snapshots.ts";
import {
  centsToEuros,
  isFullSecretKey,
  isRestrictedKey,
  parseRakCredential,
} from "../src/lib/connectors/stripe/keys.ts";
import {
  getStripeAppAuthUrl,
  getStripeOAuthRedirectUri,
  isStripeOAuthConfigured,
  normalizeStripeAccountId,
  oauthTokenToCredential,
  parseStripeOAuthInstallLink,
  sanitizeStripeEnvValue,
  TOKEN_LIFETIME_MS,
  TOKEN_REFRESH_LEAD_MS,
} from "../src/lib/connectors/stripe/oauth-config.ts";
import { isOAuthCredentialExpired } from "../src/lib/connectors/stripe/oauth-config.ts";

const ENV_KEYS = [
  "STRIPE_APP_CLIENT_ID",
  "STRIPE_APP_OAUTH_INSTALL_LINK",
  "STRIPE_APP_OAUTH_AUTHORIZE_URL",
  "STRIPE_APP_REDIRECT_URI",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const originalEnv: Record<string, string | undefined> = {};

describe("stripe connector — key validation", () => {
  it("accepts restricted keys", () => {
    assert.equal(isRestrictedKey("rk_test_abc"), true);
    assert.equal(isRestrictedKey("rk_live_xyz"), true);
    assert.equal(isRestrictedKey("sk_test_abc"), false);
  });

  it("rejects full secret keys", () => {
    assert.equal(isFullSecretKey("sk_live_abc"), true);
    assert.throws(
      () => parseRakCredential("sk_test_abc123"),
      /clé restreinte/,
    );
  });

  it("parses rak credential with livemode", () => {
    const cred = parseRakCredential("rk_test_abc", "eur");
    assert.equal(cred.mode, "rak");
    assert.equal(cred.livemode, false);
    assert.equal(cred.currency, "eur");
  });
});

describe("stripe connector — Stripe Apps OAuth", () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
    }
    process.env.STRIPE_APP_CLIENT_ID = "test_client_abc";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    delete process.env.STRIPE_APP_OAUTH_AUTHORIZE_URL;
    delete process.env.STRIPE_APP_REDIRECT_URI;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    }
  });

  it("detects oauth configuration from STRIPE_APP_CLIENT_ID", () => {
    assert.equal(isStripeOAuthConfigured(), true);
    delete process.env.STRIPE_APP_CLIENT_ID;
    assert.equal(isStripeOAuthConfigured(), false);
  });

  it("builds marketplace authorize URL", () => {
    const url = new URL(getStripeAppAuthUrl("state-token"));
    assert.equal(url.origin + url.pathname, "https://marketplace.stripe.com/oauth/v2/authorize");
    assert.equal(url.searchParams.get("client_id"), "test_client_abc");
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "http://localhost:3000/api/connectors/stripe/callback",
    );
    assert.equal(url.searchParams.get("state"), "state-token");
    assert.equal(url.searchParams.has("scope"), false);
  });

  it("supports custom authorize base for external test chnlink", () => {
    process.env.STRIPE_APP_OAUTH_AUTHORIZE_URL =
      "https://marketplace.stripe.com/oauth/v2/chnlink_test/authorize";
    const url = getStripeAppAuthUrl("s");
    assert.match(url, /chnlink_test\/authorize/);
  });

  it("parses full install link from dashboard", () => {
    const link =
      "https://marketplace.stripe.com/oauth/v2/chnlink_abc/authorize?client_id=ca_test_from_link&redirect_uri=https://old.example/cb";
    const parsed = parseStripeOAuthInstallLink(link);
    assert.ok(parsed);
    assert.equal(parsed.clientId, "ca_test_from_link");
    assert.equal(
      parsed.authorizeBase,
      "https://marketplace.stripe.com/oauth/v2/chnlink_abc/authorize",
    );
  });

  it("builds auth URL from STRIPE_APP_OAUTH_INSTALL_LINK", () => {
    delete process.env.STRIPE_APP_CLIENT_ID;
    process.env.STRIPE_APP_OAUTH_INSTALL_LINK =
      "https://marketplace.stripe.com/oauth/v2/chnlink_xyz/authorize?client_id=from_install_link";
    process.env.STRIPE_APP_REDIRECT_URI =
      "https://saa-s-radar.vercel.app/api/connectors/stripe/callback";

    assert.equal(isStripeOAuthConfigured(), true);
    const url = new URL(getStripeAppAuthUrl("state-1"));
    assert.match(url.pathname, /chnlink_xyz\/authorize/);
    assert.equal(url.searchParams.get("client_id"), "from_install_link");
    assert.equal(
      url.searchParams.get("redirect_uri"),
      "https://saa-s-radar.vercel.app/api/connectors/stripe/callback",
    );
  });

  it("strips surrounding quotes from env values", () => {
    assert.equal(sanitizeStripeEnvValue('"ca_quoted"'), "ca_quoted");
    assert.equal(sanitizeStripeEnvValue("'ca_single'"), "ca_single");
  });

  it("normalizes stripe_user_id and account_id", () => {
    assert.equal(
      normalizeStripeAccountId({
        access_token: "tok",
        stripe_user_id: "acct_from_user",
        scope: "stripe_apps",
        livemode: false,
      }),
      "acct_from_user",
    );
    assert.equal(
      normalizeStripeAccountId({
        access_token: "tok",
        account_id: "acct_from_refresh",
        scope: "stripe_apps",
        livemode: true,
      }),
      "acct_from_refresh",
    );
  });

  it("maps oauth token to credential with expiry", () => {
    const before = Date.now();
    const cred = oauthTokenToCredential(
      {
        access_token: "at_123",
        refresh_token: "rt_456",
        stripe_user_id: "acct_789",
        scope: "stripe_apps",
        livemode: false,
      },
      "eur",
    );
    const after = Date.now();
    assert.equal(cred.mode, "oauth");
    assert.equal(cred.accessToken, "at_123");
    assert.equal(cred.refreshToken, "rt_456");
    assert.equal(cred.stripeAccountId, "acct_789");
    const expiresAt = Date.parse(cred.tokenExpiresAt!);
    assert.ok(expiresAt >= before + TOKEN_LIFETIME_MS);
    assert.ok(expiresAt <= after + TOKEN_LIFETIME_MS);
  });

  it("detects expired oauth credentials before refresh lead", () => {
    const fresh = oauthTokenToCredential(
      {
        access_token: "at",
        refresh_token: "rt",
        stripe_user_id: "acct",
        scope: "stripe_apps",
        livemode: false,
      },
      "eur",
    );
    assert.equal(isOAuthCredentialExpired(fresh), false);

    const expired = {
      ...fresh,
      tokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    assert.equal(isOAuthCredentialExpired(expired), true);

    const soon = {
      ...fresh,
      tokenExpiresAt: new Date(Date.now() + TOKEN_REFRESH_LEAD_MS - 1000).toISOString(),
    };
    assert.equal(isOAuthCredentialExpired(soon), true);
  });

  it("uses explicit redirect URI when set", () => {
    process.env.STRIPE_APP_REDIRECT_URI = "https://custom.example/callback";
    assert.equal(getStripeOAuthRedirectUri(), "https://custom.example/callback");
  });
});

describe("stripe connector — analytics mapping", () => {
  it("maps mrr series and growth buckets to snapshots", () => {
    const mrrSeries = new Map<string, number>([
      ["2025-01", 10000],
      ["2025-02", 15000],
    ]);
    const growth = new Map<string, Map<string, number>>([
      ["2025-02", new Map([
        ["new", 8000],
        ["expansion", 2000],
        ["churn", 5000],
      ])],
    ]);
    const months = ["2025-01", "2025-02"];

    const snapshots = buildSnapshotsFromAnalytics(mrrSeries, growth, months, 3);

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.mrr, 100);
    assert.equal(snapshots[0]!.customers, 2);
    assert.equal(snapshots[1]!.mrr, 150);
    assert.equal(snapshots[1]!.customers, 3);
    assert.equal(snapshots[1]!.newMrr, 80);
    assert.equal(snapshots[1]!.expansionMrr, 20);
    assert.equal(snapshots[1]!.churnedMrr, 50);
    assert.equal(snapshots[1]!.source, "stripe");
    assert.equal(snapshots[1]!.arr, 1800);
  });

  it("converts cents to euros", () => {
    assert.equal(centsToEuros(12345), 123.45);
  });

  it("defines token lifetime constants", () => {
    assert.equal(TOKEN_LIFETIME_MS, 60 * 60 * 1000);
    assert.equal(TOKEN_REFRESH_LEAD_MS, 5 * 60 * 1000);
  });
});
