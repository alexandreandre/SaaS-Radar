import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBrevoCredential } from "../src/lib/connectors/brevo/keys.ts";
import {
  aggregateCampaignClicksToConversions,
  aggregateContactsToSignups,
  aggregateWebhookListAdditions,
  buildBrevoSnapshots,
  getMonthKeys,
} from "../src/lib/connectors/brevo/snapshots.ts";
import { parseBrevoWebhookPayload } from "../src/lib/connectors/brevo/webhook-parse.ts";
import { verifyBrevoWebhookToken } from "../src/lib/connectors/brevo/webhook-verify.ts";

const SAMPLE_API_KEY = "xkeysib-abcdefghijklmnopqrstuvwxyz";

describe("brevo connector — credential parsing", () => {
  it("accepts valid api key with campaign_clicks mode", () => {
    const cred = parseBrevoCredential({
      apiKey: SAMPLE_API_KEY,
      conversionMode: "campaign_clicks",
      webhookToken: "test-token-123",
    });
    assert.equal(cred.apiKey, SAMPLE_API_KEY);
    assert.equal(cred.conversionMode, "campaign_clicks");
    assert.equal(cred.conversionListId, null);
    assert.equal(cred.webhookToken, "test-token-123");
  });

  it("switches to list_addition when list id provided", () => {
    const cred = parseBrevoCredential({
      apiKey: SAMPLE_API_KEY,
      conversionListId: "42",
      conversionListName: "Clients",
    });
    assert.equal(cred.conversionMode, "list_addition");
    assert.equal(cred.conversionListId, "42");
    assert.equal(cred.conversionListName, "Clients");
  });

  it("rejects empty api key", () => {
    assert.throws(() => parseBrevoCredential({ apiKey: "" }), /Clé API Brevo/);
  });

  it("rejects short api key", () => {
    assert.throws(() => parseBrevoCredential({ apiKey: "short" }), /Format de clé/);
  });

  it("rejects list_addition without list id", () => {
    assert.throws(
      () =>
        parseBrevoCredential({
          apiKey: SAMPLE_API_KEY,
          conversionMode: "list_addition",
        }),
      /Liste de conversion/,
    );
  });
});

describe("brevo connector — signups aggregation", () => {
  it("buckets contacts by createdAt month", () => {
    const monthKeys = ["2025-04", "2025-05", "2025-06"];
    const counts = aggregateContactsToSignups(
      [
        { id: 1, email: "a@example.com", createdAt: "2025-04-15T10:00:00.000Z" },
        { id: 2, email: "b@example.com", createdAt: "2025-04-20T10:00:00.000Z" },
        { id: 3, email: "c@example.com", createdAt: "2025-05-01T10:00:00.000Z" },
      ],
      monthKeys,
    );
    assert.equal(counts.get("2025-04"), 2);
    assert.equal(counts.get("2025-05"), 1);
    assert.equal(counts.get("2025-06"), undefined);
  });
});

describe("brevo connector — campaign conversions", () => {
  it("sums uniqueClicks by sentDate month for sent campaigns", () => {
    const monthKeys = ["2025-03", "2025-04"];
    const counts = aggregateCampaignClicksToConversions(
      [
        {
          id: 1,
          name: "Launch",
          status: "sent",
          sentDate: "2025-03-10T12:00:00.000Z",
          statistics: { globalStats: { uniqueClicks: 120 } },
        },
        {
          id: 2,
          name: "Follow-up",
          status: "sent",
          sentDate: "2025-03-20T12:00:00.000Z",
          statistics: { globalStats: { uniqueClicks: 30 } },
        },
        {
          id: 3,
          name: "Draft",
          status: "draft",
          sentDate: "2025-04-01T12:00:00.000Z",
          statistics: { globalStats: { uniqueClicks: 999 } },
        },
      ],
      monthKeys,
    );
    assert.equal(counts.get("2025-03"), 150);
    assert.equal(counts.get("2025-04"), undefined);
  });
});

describe("brevo connector — webhook list additions", () => {
  it("deduplicates contacts per month and filters by list id", () => {
    const monthKeys = ["2025-06"];
    const counts = aggregateWebhookListAdditions(
      [
        {
          eventName: "list_addition",
          eventTime: "2025-06-10T08:00:00.000Z",
          contactId: "user1@example.com",
          listIds: [42, 10],
        },
        {
          eventName: "list_addition",
          eventTime: "2025-06-15T08:00:00.000Z",
          contactId: "user1@example.com",
          listIds: [42],
        },
        {
          eventName: "list_addition",
          eventTime: "2025-06-12T08:00:00.000Z",
          contactId: "user2@example.com",
          listIds: [99],
        },
      ],
      monthKeys,
      "42",
    );
    assert.equal(counts.get("2025-06"), 1);
  });
});

describe("brevo connector — webhook parse and verify", () => {
  it("parses list_addition payload", () => {
    const parsed = parseBrevoWebhookPayload({
      id: 12345,
      email: "lead@example.com",
      event: "list_addition",
      list_id: [42],
      ts: 1718000000,
    });
    assert.ok(parsed);
    assert.equal(parsed!.eventName, "list_addition");
    assert.equal(parsed!.contactId, "lead@example.com");
    assert.deepEqual(parsed!.listIds, [42]);
  });

  it("ignores unsupported events", () => {
    assert.equal(parseBrevoWebhookPayload({ event: "opened" }), null);
  });

  it("verifies webhook token", () => {
    assert.deepEqual(verifyBrevoWebhookToken("secret", "secret"), { ok: true });
    assert.equal(verifyBrevoWebhookToken("wrong", "secret").ok, false);
    assert.equal(verifyBrevoWebhookToken(null, "secret").ok, false);
  });
});

describe("brevo connector — snapshot builder", () => {
  it("builds monthly snapshots with signups and conversions", () => {
    const monthKeys = getMonthKeys(3).slice(0, 2);
    const snapshots = buildBrevoSnapshots({
      monthKeys,
      signupsByMonth: new Map([[monthKeys[0]!, 5]]),
      conversionsByMonth: new Map([[monthKeys[1]!, 3]]),
    });
    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.signups, 5);
    assert.equal(snapshots[0]!.conversions, 0);
    assert.equal(snapshots[1]!.conversions, 3);
    assert.equal(snapshots[0]!.source, "brevo");
  });
});
