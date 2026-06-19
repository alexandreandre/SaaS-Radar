import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";
import { parseLoopsCredential, isValidWebhookSigningSecret } from "../src/lib/connectors/loops/keys.ts";
import {
  aggregateLoopsEventsToSnapshots,
  buildEmptySnapshots,
  getMonthKeys,
} from "../src/lib/connectors/loops/snapshots.ts";
import { parseLoopsWebhookPayload } from "../src/lib/connectors/loops/webhook-parse.ts";
import { verifyLoopsWebhookSignature } from "../src/lib/connectors/loops/webhook-verify.ts";

describe("loops connector — credential parsing", () => {
  it("accepts valid api key and webhook secret", () => {
    const cred = parseLoopsCredential({
      apiKey: "abcdefghijklmnopqrst",
      webhookSigningSecret: "whsec_dGVzdHNlY3JldA==",
      conversionListId: "list_123",
    });
    assert.equal(cred.apiKey, "abcdefghijklmnopqrst");
    assert.equal(cred.conversionMode, "mailing_list");
    assert.equal(cred.conversionListId, "list_123");
  });

  it("defaults to email_clicked when no conversion list", () => {
    const cred = parseLoopsCredential({
      apiKey: "abcdefghijklmnopqrst",
      webhookSigningSecret: "whsec_dGVzdHNlY3JldA==",
    });
    assert.equal(cred.conversionMode, "email_clicked");
    assert.equal(cred.conversionListId, null);
  });

  it("rejects empty api key", () => {
    assert.throws(
      () =>
        parseLoopsCredential({
          apiKey: "",
          webhookSigningSecret: "whsec_dGVzdHNlY3JldA==",
        }),
      /Clé API Loops/,
    );
  });

  it("rejects invalid webhook secret", () => {
    assert.equal(isValidWebhookSigningSecret("bad"), false);
    assert.throws(
      () =>
        parseLoopsCredential({
          apiKey: "abcdefghijklmnopqrst",
          webhookSigningSecret: "bad",
        }),
      /secret webhook/,
    );
  });
});

describe("loops connector — webhook verification", () => {
  const secret = "whsec_" + Buffer.from("testsecret").toString("base64");
  const eventId = "evt_123";
  const timestamp = "1734425918";
  const rawBody = JSON.stringify({ eventName: "contact.created", eventTime: 1734425918 });

  function sign(body: string): string {
    const secretPart = secret.split("_")[1]!;
    const signedContent = `${eventId}.${timestamp}.${body}`;
    const signature = crypto
      .createHmac("sha256", Buffer.from(secretPart, "base64"))
      .update(signedContent)
      .digest("base64");
    return `v1,${signature}`;
  }

  it("accepts valid signature", () => {
    const result = verifyLoopsWebhookSignature({
      eventId,
      timestamp,
      signatureHeader: sign(rawBody),
      rawBody,
      signingSecret: secret,
    });
    assert.equal(result.ok, true);
  });

  it("rejects invalid signature", () => {
    const result = verifyLoopsWebhookSignature({
      eventId,
      timestamp,
      signatureHeader: "v1,invalid",
      rawBody,
      signingSecret: secret,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "INVALID_SIGNATURE");
    }
  });

  it("rejects missing headers", () => {
    const result = verifyLoopsWebhookSignature({
      eventId: "",
      timestamp,
      signatureHeader: sign(rawBody),
      rawBody,
      signingSecret: secret,
    });
    assert.equal(result.ok, false);
  });
});

describe("loops connector — webhook payload parsing", () => {
  it("parses contact.created payload", () => {
    const parsed = parseLoopsWebhookPayload("wh_1", {
      eventName: "contact.created",
      eventTime: 1734425918,
      contactIdentity: { id: "contact_1", email: "a@b.com" },
    });
    assert.ok(parsed);
    assert.equal(parsed!.eventName, "contact.created");
    assert.equal(parsed!.contactId, "contact_1");
    assert.match(parsed!.eventTime, /^2024-/);
  });
});

describe("loops connector — snapshot aggregation", () => {
  it("aggregates signups and mailing list conversions by month", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const snapshots = aggregateLoopsEventsToSnapshots({
      monthKeys,
      conversionListId: "list_conv",
      conversionMode: "mailing_list",
      events: [
        {
          eventName: "contact.created",
          eventTime: "2025-01-15T10:00:00.000Z",
          contactId: "c1",
          mailingListId: null,
        },
        {
          eventName: "contact.created",
          eventTime: "2025-01-20T10:00:00.000Z",
          contactId: "c2",
          mailingListId: null,
        },
        {
          eventName: "contact.created",
          eventTime: "2025-01-25T10:00:00.000Z",
          contactId: "c1",
          mailingListId: null,
        },
        {
          eventName: "contact.mailingList.subscribed",
          eventTime: "2025-02-01T10:00:00.000Z",
          contactId: "c3",
          mailingListId: "list_conv",
        },
        {
          eventName: "contact.mailingList.subscribed",
          eventTime: "2025-02-02T10:00:00.000Z",
          contactId: "c4",
          mailingListId: "list_other",
        },
      ],
    });

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.signups, 2);
    assert.equal(snapshots[0]!.conversions, 0);
    assert.equal(snapshots[1]!.signups, 0);
    assert.equal(snapshots[1]!.conversions, 1);
    assert.equal(snapshots[0]!.source, "loops");
  });

  it("uses email.clicked for conversions in fallback mode", () => {
    const monthKeys = ["2025-03"];
    const snapshots = aggregateLoopsEventsToSnapshots({
      monthKeys,
      conversionMode: "email_clicked",
      events: [
        {
          eventName: "email.clicked",
          eventTime: "2025-03-10T10:00:00.000Z",
          contactId: "c1",
          mailingListId: null,
        },
        {
          eventName: "email.clicked",
          eventTime: "2025-03-11T10:00:00.000Z",
          contactId: "c1",
          mailingListId: null,
        },
      ],
    });

    assert.equal(snapshots[0]!.conversions, 1);
  });

  it("builds empty snapshots for month keys", () => {
    const monthKeys = getMonthKeys(3);
    const snapshots = buildEmptySnapshots(monthKeys);
    assert.equal(snapshots.length, 3);
    assert.equal(snapshots.every((s) => s.signups === 0 && s.conversions === 0), true);
  });
});
