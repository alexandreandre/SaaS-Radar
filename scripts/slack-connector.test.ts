import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCommsStreamFromStats,
  buildSlackAccountLabel,
  filterUndeliveredAlerts,
  formatSlackAlertBlocks,
  parseSlackOAuthResponse,
  trimDeliveredAlertIds,
} from "../src/lib/connectors/slack/alert-dispatch.ts";
import type { CockpitAlert } from "../src/lib/cockpit-alerts.ts";

describe("slack connector — account label", () => {
  it("combines channel and team names", () => {
    assert.equal(
      buildSlackAccountLabel({ channelName: "#founders", teamName: "Acme" }),
      "#founders · Acme",
    );
    assert.equal(buildSlackAccountLabel({ teamName: "Acme" }), "Acme");
  });
});

describe("slack connector — alert dedup", () => {
  it("filters already delivered alert ids", () => {
    const alerts: CockpitAlert[] = [
      { id: "churn-spike", severity: "warning", message: "Churn", actionModule: "revenus" },
      { id: "cac-ltv", severity: "critical", message: "CAC", actionModule: "acquisition" },
    ];

    const pending = filterUndeliveredAlerts(alerts, ["churn-spike"]);
    assert.equal(pending.length, 1);
    assert.equal(pending[0]?.id, "cac-ltv");
  });

  it("trims delivered ids to a sliding window", () => {
    const trimmed = trimDeliveredAlertIds(["a", "b"], ["c", "d", "e"]);
    assert.ok(trimmed.length <= 50);
    assert.equal(trimmed.at(-1), "e");
  });
});

describe("slack connector — comms stream", () => {
  it("builds a normalized comms stream payload", () => {
    const stream = buildCommsStreamFromStats({
      alertsSent: 3,
      lastAlertAt: "2026-06-19T10:00:00.000Z",
    });
    assert.equal(stream.type, "comms");
    assert.equal(stream.alertsSent, 3);
    assert.equal(stream.lastAlertAt, "2026-06-19T10:00:00.000Z");
  });
});

describe("slack connector — block kit", () => {
  it("formats alert blocks with cockpit module link", () => {
    const payload = formatSlackAlertBlocks(
      {
        id: "churn-spike",
        severity: "warning",
        message: "Pic de churn détecté",
        actionModule: "revenus",
      },
      "https://saasradar.fr/cockpit/proj-1",
    );

    assert.match(payload.text, /Pic de churn/);
    assert.equal(payload.blocks.length, 2);
    const actions = payload.blocks[1] as { elements?: { url?: string }[] };
    assert.match(actions.elements?.[0]?.url ?? "", /module=revenus/);
  });
});

describe("slack connector — oauth parsing", () => {
  it("maps oauth.v2.access response to credential", () => {
    const credential = parseSlackOAuthResponse({
      ok: true,
      access_token: "xoxb-test",
      scope: "chat:write,channels:read",
      bot_user_id: "U123",
      app_id: "A123",
      team: { id: "T123", name: "Team Test" },
    });

    assert.ok(credential);
    assert.equal(credential?.botAccessToken, "xoxb-test");
    assert.equal(credential?.teamId, "T123");
    assert.deepEqual(credential?.deliveredAlertIds, []);
  });

  it("returns null for invalid oauth responses", () => {
    assert.equal(parseSlackOAuthResponse({ ok: false, error: "invalid_code" }), null);
  });
});
