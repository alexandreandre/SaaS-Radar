/**
 * Recette connecteur Qonto — logique métier, fallback sync, persistance DB (si env).
 * Usage : node --require ./scripts/register-server-only-stub.cjs --import tsx --env-file=.env.local scripts/qonto-connector-recette.ts
 */
import assert from "node:assert/strict";
import { applyConnectorSyncToProject } from "../src/lib/connectors/integration-client.ts";
import {
  saveConnectorCredential,
  loadConnectorCredential,
  deleteConnectorCredential,
} from "../src/lib/connectors/credentials-store.ts";
import { fetchQontoConnectorSync } from "../src/lib/connectors/qonto/metrics.ts";
import { buildQontoFinanceStream } from "../src/lib/connectors/qonto/snapshots.ts";
import type { QontoCredential } from "../src/lib/connectors/qonto/types.ts";
import { computeBurnRate, computeRunwayMonths } from "../src/lib/portfolio.ts";
import type { UserProject } from "../src/lib/portfolio.ts";
import { isCredentialsEncryptionConfigured } from "../src/lib/crypto/credentials.ts";
import { isQontoConfigured } from "../src/lib/connectors/qonto/oauth.ts";
import { createAdminClient } from "../src/lib/supabase/admin.ts";

const results: Array<{ step: string; ok: boolean; detail?: string }> = [];

function pass(step: string, detail?: string) {
  results.push({ step, ok: true, detail });
  console.log(`✓ ${step}${detail ? ` — ${detail}` : ""}`);
}

function fail(step: string, detail: string) {
  results.push({ step, ok: false, detail });
  console.error(`✗ ${step} — ${detail}`);
}

function sampleCredential(): QontoCredential {
  const now = Date.now();
  return {
    accessToken: "test-access",
    refreshToken: "test-refresh",
    accessTokenExpiresAt: new Date(now + 3600_000).toISOString(),
    organizationId: "org-test-uuid",
    organizationSlug: "acme-test",
    organizationName: "Acme Test SAS",
    environment: "production",
  };
}

async function testFinanceStreamAggregation() {
  const stream = buildQontoFinanceStream({
    accounts: [
      { id: "1", balance_cents: 5000000, is_external_account: false, status: "active" },
    ],
    transactions: [
      {
        id: "t1",
        side: "credit",
        amount_cents: 200000,
        status: "completed",
        settled_at: "2026-06-10T10:00:00.000Z",
      },
      {
        id: "t2",
        side: "debit",
        amount_cents: 350000,
        status: "completed",
        settled_at: "2026-06-12T10:00:00.000Z",
      },
    ],
    monthKey: "2026-06",
  });
  assert.equal(stream.type, "finance");
  assert.equal(stream.cashBalance, 50000);
  assert.equal(stream.monthlyInflow, 2000);
  assert.equal(stream.monthlyOutflow, 3500);
  pass("Agrégation FinanceStream", `cash=${stream.cashBalance}€ runway=${stream.runwayDays}j`);
}

async function testPortfolioRunwayFromQonto() {
  const project: UserProject = {
    id: "proj-test",
    name: "Test",
    currentMrr: 5000,
    integrations: [
      { connectorId: "qonto", status: "connected", accountLabel: "Acme Test SAS" },
    ],
    connectorStreams: {
      qonto: {
        type: "finance",
        cashBalance: 30000,
        monthlyInflow: 4000,
        monthlyOutflow: 7000,
        runwayDays: 128,
      },
    },
    cashOnHand: 5000,
    expenses: [{ id: "e1", category: "tools", label: "SaaS", amount: 200, recurring: true, date: "2026-06-01" }],
  };

  const burn = computeBurnRate(project);
  const runway = computeRunwayMonths(project);
  assert.equal(burn, 3000);
  assert.equal(runway, 10);
  pass("Runway cockpit depuis Qonto", `burn=${burn}€/mois runway=${runway} mois`);
}

async function testFallbackSync() {
  process.env.QONTO_CONNECTOR_FALLBACK = "1";
  const result = await fetchQontoConnectorSync(sampleCredential());
  assert.equal(result.stream?.type, "finance");
  assert.ok((result.stream?.cashBalance ?? 0) > 0);
  delete process.env.QONTO_CONNECTOR_FALLBACK;
  pass("Sync fallback (sans API Qonto)", `cash=${result.stream?.cashBalance}€`);
}

async function testApplySyncToProject() {
  const project: UserProject = {
    id: "proj-test",
    name: "Test",
    currentMrr: 5000,
  };
  const synced = applyConnectorSyncToProject(
    project,
    "qonto",
    {
      stream: {
        type: "finance",
        cashBalance: 12000,
        monthlyInflow: 5000,
        monthlyOutflow: 4000,
        runwayDays: 360,
      },
      accountLabel: "Acme Test SAS",
      syncedAt: new Date().toISOString(),
    },
    "connected",
    "Acme Test SAS",
  );
  assert.equal(synced.connectorStreams?.qonto?.type, "finance");
  assert.equal(synced.integrations?.find((i) => i.connectorId === "qonto")?.status, "connected");
  pass("applyConnectorSyncToProject", "stream + intégration connectée");
}

async function testDbCredentialRoundTrip() {
  if (!isCredentialsEncryptionConfigured()) {
    fail("Persistance DB", "CREDENTIALS_ENCRYPTION_KEY absente");
    return;
  }

  const supabase = createAdminClient();
  const { data: projectRow, error: projectError } = await supabase
    .from("user_projects")
    .select("id, user_id")
    .limit(1)
    .maybeSingle();

  if (projectError || !projectRow) {
    fail("Persistance DB", `Aucun projet trouvé : ${projectError?.message ?? "vide"}`);
    return;
  }

  const userId = projectRow.user_id as string;
  const projectId = projectRow.id as string;
  const credential = sampleCredential();

  try {
    await saveConnectorCredential(userId, projectId, "qonto", credential, {
      oauthConnected: true,
      accountLabel: credential.organizationName,
    });
    const loaded = await loadConnectorCredential<QontoCredential>(userId, projectId, "qonto");
    assert.ok(loaded?.data?.refreshToken === credential.refreshToken);
    await deleteConnectorCredential(userId, projectId, "qonto");
    pass(
      "Persistance DB (save/load/delete)",
      `provider=qonto project=${projectId.slice(0, 8)}…`,
    );
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message)
          : JSON.stringify(err);
    if (message.includes("connector_credentials_provider_check") || message.includes("provider")) {
      fail(
        "Persistance DB",
        `Migration 034+ non appliquée — exécutez bash scripts/apply-connector-migrations.sh avec DATABASE_URL`,
      );
    } else {
      fail("Persistance DB", message);
    }
  }
}

function reportOAuthConfig() {
  if (isQontoConfigured()) {
    pass("Config OAuth plateforme", "QONTO_CLIENT_ID / SECRET / REDIRECT_URI présents");
  } else {
    fail(
      "Config OAuth plateforme",
      "Ajoutez QONTO_CLIENT_ID, QONTO_CLIENT_SECRET, QONTO_REDIRECT_URI dans .env.local",
    );
  }
}

async function main() {
  console.log("=== Recette connecteur Qonto ===\n");

  try {
    await testFinanceStreamAggregation();
  } catch (err) {
    fail("Agrégation FinanceStream", err instanceof Error ? err.message : String(err));
  }

  try {
    await testPortfolioRunwayFromQonto();
  } catch (err) {
    fail("Runway cockpit", err instanceof Error ? err.message : String(err));
  }

  try {
    await testFallbackSync();
  } catch (err) {
    fail("Sync fallback", err instanceof Error ? err.message : String(err));
  }

  try {
    await testApplySyncToProject();
  } catch (err) {
    fail("applyConnectorSyncToProject", err instanceof Error ? err.message : String(err));
  }

  await testDbCredentialRoundTrip();
  reportOAuthConfig();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Résultat : ${results.length - failed.length}/${results.length} OK ===`);

  if (failed.length > 0) {
    console.log("\nActions manuelles requises :");
    for (const f of failed) {
      console.log(`  - ${f.step}: ${f.detail}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
