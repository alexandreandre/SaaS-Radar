import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseVercelCredential } from "../src/lib/connectors/vercel/keys.ts";
import { resolveVercelRedirectUri } from "../src/lib/connectors/vercel/redirect-uri.ts";
import { resolveVercelProjectAfterOAuth } from "../src/lib/connectors/vercel/resolve.ts";
import {
  buildDevStreamFromMetrics,
  countDeploymentsLast30d,
  computeDeploySuccessRate,
  parseBillingChargesJsonl,
} from "../src/lib/connectors/vercel/streams.ts";
import type { VercelDeployMetrics } from "../src/lib/connectors/vercel/types.ts";

const NOW = new Date("2026-06-18T12:00:00.000Z").getTime();

describe("vercel connector — credential parsing", () => {
  it("accepts valid credential with project", () => {
    const cred = parseVercelCredential({
      accessToken: "tok_abc123",
      teamId: "team_1",
      vercelProjectId: "prj_1",
      projectName: "mon-saas",
    });
    assert.equal(cred.accessToken, "tok_abc123");
    assert.equal(cred.teamId, "team_1");
    assert.equal(cred.vercelProjectId, "prj_1");
    assert.equal(cred.projectName, "mon-saas");
  });

  it("rejects missing access token", () => {
    assert.throws(
      () => parseVercelCredential({ accessToken: "" }),
      /Token Vercel manquant/,
    );
  });
});

describe("vercel connector — deployment counting", () => {
  const deployments = [
    { createdAt: NOW - 5 * 24 * 60 * 60 * 1000, state: "READY" },
    { createdAt: NOW - 10 * 24 * 60 * 60 * 1000, state: "ERROR", readyState: "ERROR" },
    { createdAt: NOW - 40 * 24 * 60 * 60 * 1000, state: "READY" },
  ];

  it("counts deployments in last 30 days", () => {
    assert.equal(countDeploymentsLast30d(deployments, NOW), 2);
  });

  it("computes deploy success rate", () => {
    assert.equal(computeDeploySuccessRate(deployments, NOW), 50);
  });

  it("defaults success rate when no recent deploys", () => {
    assert.equal(
      computeDeploySuccessRate([{ createdAt: NOW - 40 * 24 * 60 * 60 * 1000, state: "READY" }], NOW),
      99.9,
    );
  });
});

describe("vercel connector — billing parser", () => {
  it("sums billed costs from JSONL", () => {
    const raw = [
      '{"BilledCost":12.5,"ProjectId":"prj_1"}',
      '{"billedCost":3.25,"projectId":"prj_1"}',
      '{"BilledCost":99,"ProjectId":"prj_other"}',
    ].join("\n");

    assert.equal(parseBillingChargesJsonl(raw, "prj_1"), 15.75);
  });

  it("returns zero for empty input", () => {
    assert.equal(parseBillingChargesJsonl(""), 0);
  });
});

describe("vercel connector — dev stream mapping", () => {
  it("maps metrics to DevStream with error state", () => {
    const metrics: VercelDeployMetrics = {
      projectId: "prj_1",
      projectName: "demo",
      productionUrl: "https://demo.vercel.app",
      lastDeploymentState: "ERROR",
      lastDeploymentAt: "2026-06-18T10:00:00.000Z",
      deploysLast30d: 4,
      uptimePct: 75,
      infraCostMonthly: 12.34,
      billingAvailable: true,
    };

    const stream = buildDevStreamFromMetrics(metrics);
    assert.equal(stream.type, "dev");
    assert.equal(stream.deploysLast30d, 4);
    assert.equal(stream.uptimePct, 75);
    assert.equal(stream.errorRate, 2);
    assert.equal(stream.deploymentUrl, "https://demo.vercel.app");
    assert.equal(stream.lastDeploymentState, "ERROR");
    assert.equal(stream.infraCostMonthly, 12.34);
  });

  it("omits infra cost when zero", () => {
    const stream = buildDevStreamFromMetrics({
      projectId: "prj_1",
      projectName: "demo",
      productionUrl: "",
      lastDeploymentState: "READY",
      lastDeploymentAt: null,
      deploysLast30d: 0,
      uptimePct: 99.9,
      infraCostMonthly: 0,
      billingAvailable: false,
    });
    assert.equal(stream.infraCostMonthly, undefined);
    assert.equal(stream.errorRate, 0);
  });
});

describe("vercel connector — redirect uri", () => {
  it("uses explicit redirect when provided", () => {
    assert.equal(
      resolveVercelRedirectUri({
        VERCEL_REDIRECT_URI: "https://custom.example/callback",
        NEXT_PUBLIC_APP_URL: "https://app.example",
      }),
      "https://custom.example/callback",
    );
  });

  it("derives redirect from app url", () => {
    assert.equal(
      resolveVercelRedirectUri({ NEXT_PUBLIC_APP_URL: "https://app.example/" }),
      "https://app.example/api/connectors/vercel/callback",
    );
  });

  it("returns null without resolvable redirect", () => {
    assert.equal(resolveVercelRedirectUri({}), null);
  });
});

describe("vercel connector — project resolution", () => {
  const projects = [
    { id: "prj_a", name: "Alpha", repo: "acme/alpha" },
    { id: "prj_b", name: "Beta", repo: "acme/beta" },
  ];

  it("auto-selects single project", () => {
    const result = resolveVercelProjectAfterOAuth([{ id: "prj_1", name: "Solo" }]);
    assert.equal(result.kind, "auto");
    if (result.kind === "auto") assert.equal(result.projectId, "prj_1");
  });

  it("matches github repo among multiple projects", () => {
    const result = resolveVercelProjectAfterOAuth(projects, "acme/beta");
    assert.equal(result.kind, "auto");
    if (result.kind === "auto") assert.equal(result.projectId, "prj_b");
  });

  it("requires manual choice when ambiguous", () => {
    const result = resolveVercelProjectAfterOAuth(projects);
    assert.equal(result.kind, "choose");
  });

  it("returns none without projects", () => {
    assert.equal(resolveVercelProjectAfterOAuth([]).kind, "none");
  });
});
