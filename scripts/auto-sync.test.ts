import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTO_SYNC_MIN_INTERVAL_MS,
  listAutoSyncableConnectorIds,
  shouldAutoSync,
} from "../src/lib/connectors/auto-sync.ts";
import type { Integration } from "../src/lib/connectors/types.ts";

function makeIntegration(overrides: Partial<Integration> = {}): Integration {
  return {
    connectorId: "paddle",
    status: "connected",
    ...overrides,
  };
}

describe("auto-sync — shouldAutoSync", () => {
  const now = Date.parse("2026-06-19T12:00:00.000Z");

  it("sync when never synced", () => {
    assert.equal(
      shouldAutoSync(makeIntegration({ lastSyncAt: undefined }), { now }),
      true,
    );
  });

  it("skip recent sync within interval", () => {
    const recent = new Date(now - AUTO_SYNC_MIN_INTERVAL_MS + 60_000).toISOString();
    assert.equal(shouldAutoSync(makeIntegration({ lastSyncAt: recent }), { now }), false);
  });

  it("sync when stale beyond interval", () => {
    const stale = new Date(now - AUTO_SYNC_MIN_INTERVAL_MS - 1).toISOString();
    assert.equal(shouldAutoSync(makeIntegration({ lastSyncAt: stale }), { now }), true);
  });

  it("skip demo integrations", () => {
    assert.equal(
      shouldAutoSync(makeIntegration({ status: "demo", lastSyncAt: undefined }), { now }),
      false,
    );
  });

  it("skip disconnected integrations", () => {
    assert.equal(
      shouldAutoSync(makeIntegration({ status: "disconnected", lastSyncAt: undefined }), {
        now,
      }),
      false,
    );
  });

  it("skip when token expired", () => {
    assert.equal(
      shouldAutoSync(
        makeIntegration({
          connectorId: "meta-ads",
          tokenExpiresAt: new Date(now - 86_400_000).toISOString(),
          lastSyncAt: undefined,
        }),
        { now },
      ),
      false,
    );
  });

  it("force sync ignores staleness but not token expiry", () => {
    const recent = new Date(now - 60_000).toISOString();
    assert.equal(shouldAutoSync(makeIntegration({ lastSyncAt: recent }), { force: true, now }), true);
    assert.equal(
      shouldAutoSync(
        makeIntegration({
          connectorId: "google-ads",
          tokenExpiresAt: new Date(now - 86_400_000).toISOString(),
          lastSyncAt: recent,
        }),
        { force: true, now },
      ),
      false,
    );
  });
});

describe("auto-sync — listAutoSyncableConnectorIds", () => {
  const now = Date.parse("2026-06-19T12:00:00.000Z");

  it("returns only eligible connected integrations", () => {
    const stale = new Date(now - AUTO_SYNC_MIN_INTERVAL_MS - 1).toISOString();
    const ids = listAutoSyncableConnectorIds(
      [
        makeIntegration({ connectorId: "paddle", lastSyncAt: stale }),
        makeIntegration({ connectorId: "stripe", status: "demo" }),
        makeIntegration({ connectorId: "plausible", status: "disconnected", lastSyncAt: stale }),
      ],
      { now },
    );
    assert.deepEqual(ids, ["paddle"]);
  });
});
