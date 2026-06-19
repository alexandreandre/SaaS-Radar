import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";
import {
  parseResendCredential,
  isValidWebhookSigningSecret,
} from "../src/lib/connectors/resend/keys.ts";
import {
  aggregateContactsToSignups,
  aggregateEmailClicksToConversions,
  buildResendSnapshots,
  getMonthKeys,
} from "../src/lib/connectors/resend/snapshots.ts";
import { parseResendWebhookPayload } from "../src/lib/connectors/resend/webhook-parse.ts";
import { verifyResendWebhookSignature } from "../src/lib/connectors/resend/webhook-verify.ts";

describe("resend connector — credential parsing", () => {
  it("accepts valid api key and webhook secret", () => {
    const cred = parseResendCredential({
      apiKey: "re_abcdefghijklmnopqrst",
      webhookSigningSecret: "whsec_dGVzdHNlY3JldA==",
      conversionSegmentId: "seg_123",
    });
    assert.equal(cred.apiKey, "re_abcdefghijklmnopqrst");
    assert.equal(cred.conversionMode, "segment");
    assert.equal(cred.conversionSegmentId, "seg_123");
  });

  it("defaults to email_clicked when no segment", () => {
    const cred = parseResendCredential({
      apiKey: "re_abcdefghijklmnopqrst",
      webhookSigningSecret: "whsec_dGVzdHNlY3JldA==",
    });
    assert.equal(cred.conversionMode, "email_clicked");
    assert.equal(cred.conversionSegmentId, null);
  });

  it("rejects empty api key", () => {
    assert.throws(
      () =>
        parseResendCredential({
          apiKey: "",
          webhookSigningSecret: "whsec_dGVzdHNlY3JldA==",
        }),
      /Clé API Resend/,
    );
  });

  it("rejects api key without re_ prefix", () => {
    assert.throws(
      () =>
        parseResendCredential({
          apiKey: "sk_test_123456789012345",
          webhookSigningSecret: "whsec_dGVzdHNlY3JldA==",
        }),
      /Format de clé API Resend/,
    );
  });

  it("rejects invalid webhook secret", () => {
    assert.equal(isValidWebhookSigningSecret("bad"), false);
    assert.throws(
      () =>
        parseResendCredential({
          apiKey: "re_abcdefghijklmnopqrst",
          webhookSigningSecret: "bad",
        }),
      /secret webhook/,
    );
  });
});

describe("resend connector — webhook verification", () => {
  const secret = "whsec_" + Buffer.from("testsecret").toString("base64");
  const eventId = "msg_123";
  const timestamp = "1734425918";
  const rawBody = JSON.stringify({
    type: "email.clicked",
    created_at: "2025-01-15T10:00:00.000Z",
    data: { to: ["user@example.com"] },
  });

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
    const result = verifyResendWebhookSignature({
      eventId,
      timestamp,
      signatureHeader: sign(rawBody),
      rawBody,
      signingSecret: secret,
    });
    assert.equal(result.ok, true);
  });

  it("rejects invalid signature", () => {
    const result = verifyResendWebhookSignature({
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
    const result = verifyResendWebhookSignature({
      eventId: "",
      timestamp,
      signatureHeader: sign(rawBody),
      rawBody,
      signingSecret: secret,
    });
    assert.equal(result.ok, false);
  });
});

describe("resend connector — webhook payload parsing", () => {
  it("parses email.clicked payload", () => {
    const parsed = parseResendWebhookPayload("msg_1", {
      type: "email.clicked",
      created_at: "2025-01-15T10:00:00.000Z",
      data: {
        to: ["user@example.com"],
        click: { timestamp: "2025-01-15T10:05:00.000Z" },
      },
    });
    assert.ok(parsed);
    assert.equal(parsed!.eventName, "email.clicked");
    assert.equal(parsed!.recipientEmail, "user@example.com");
    assert.equal(parsed!.eventTime, "2025-01-15T10:05:00.000Z");
  });

  it("ignores unsupported events", () => {
    const parsed = parseResendWebhookPayload("msg_2", {
      type: "email.delivered",
      data: { to: ["user@example.com"] },
    });
    assert.equal(parsed, null);
  });
});

describe("resend connector — snapshot aggregation", () => {
  it("aggregates contacts to signups by month", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const signupsByMonth = aggregateContactsToSignups(
      [
        { id: "c1", email: "a@b.com", created_at: "2025-01-15 10:00:00.000+00" },
        { id: "c2", email: "b@b.com", created_at: "2025-01-20 10:00:00.000+00" },
        { id: "c3", email: "c@b.com", created_at: "2025-02-01 10:00:00.000+00" },
      ],
      monthKeys,
    );

    const snapshots = buildResendSnapshots({
      monthKeys,
      signupsByMonth,
      conversionsByMonth: new Map(),
    });

    assert.equal(snapshots[0]!.signups, 2);
    assert.equal(snapshots[1]!.signups, 1);
    assert.equal(snapshots[0]!.source, "resend");
  });

  it("aggregates email clicks to unique conversions by month", () => {
    const monthKeys = ["2025-03"];
    const conversionsByMonth = aggregateEmailClicksToConversions(
      [
        {
          eventName: "email.clicked",
          eventTime: "2025-03-10T10:00:00.000Z",
          contactId: "user@example.com",
          segmentId: null,
          recipientEmail: "user@example.com",
        },
        {
          eventName: "email.clicked",
          eventTime: "2025-03-11T10:00:00.000Z",
          contactId: "user@example.com",
          segmentId: null,
          recipientEmail: "user@example.com",
        },
        {
          eventName: "email.clicked",
          eventTime: "2025-03-12T10:00:00.000Z",
          contactId: "other@example.com",
          segmentId: null,
          recipientEmail: "other@example.com",
        },
      ],
      monthKeys,
    );

    const snapshots = buildResendSnapshots({
      monthKeys,
      signupsByMonth: new Map(),
      conversionsByMonth,
    });

    assert.equal(snapshots[0]!.conversions, 2);
  });

  it("builds empty snapshots for month keys", () => {
    const monthKeys = getMonthKeys(3);
    const snapshots = buildResendSnapshots({
      monthKeys,
      signupsByMonth: new Map(),
      conversionsByMonth: new Map(),
    });
    assert.equal(snapshots.length, 3);
    assert.equal(snapshots.every((s) => s.signups === 0 && s.conversions === 0), true);
  });
});
