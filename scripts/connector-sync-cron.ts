/**
 * Cron prod : synchronise tous les connecteurs éligibles (credentials Supabase).
 */
import { listAllConnectorCredentials } from "../src/lib/connectors/credentials-store";
import { listPendingConnectorSyncJobs } from "../src/lib/connectors/sync-jobs";
import { providerToConnectorId, syncConnectorForProject } from "../src/lib/connectors/sync-orchestrator";
import { isCredentialsEncryptionConfigured } from "../src/lib/crypto/credentials";
import { createAdminClient } from "../src/lib/supabase/admin";

async function processPendingJobs(): Promise<{ synced: number; errors: number }> {
  const jobs = await listPendingConnectorSyncJobs(25);
  if (jobs.length === 0) return { synced: 0, errors: 0 };

  console.log(`File sync : ${jobs.length} job(s) en attente`);
  const admin = createAdminClient();
  let synced = 0;
  let errors = 0;

  for (const job of jobs) {
    await admin
      .from("connector_sync_jobs")
      .update({ status: "running", started_at: new Date().toISOString(), attempts: job.attempts + 1 })
      .eq("id", job.id);

    try {
      const result = await syncConnectorForProject(job.userId, job.projectId, job.provider);
      if (result.status === "synced") {
        synced += 1;
        await admin
          .from("connector_sync_jobs")
          .update({ status: "completed", finished_at: new Date().toISOString(), last_error: null })
          .eq("id", job.id);
      } else {
        errors += 1;
        await admin
          .from("connector_sync_jobs")
          .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            last_error: result.message ?? result.reason ?? "skipped",
          })
          .eq("id", job.id);
      }
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      await admin
        .from("connector_sync_jobs")
        .update({ status: "failed", finished_at: new Date().toISOString(), last_error: message })
        .eq("id", job.id);
    }
  }

  return { synced, errors };
}

async function main(): Promise<void> {
  if (!isCredentialsEncryptionConfigured()) {
    console.error("CREDENTIALS_ENCRYPTION_KEY requis — exit 1");
    process.exit(1);
  }

  try {
    const jobResult = await processPendingJobs();
    console.log(`File sync terminée — synced=${jobResult.synced} errors=${jobResult.errors}`);
  } catch (err) {
    console.warn(
      `File sync ignorée: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const rows = await listAllConnectorCredentials();
  if (rows.length === 0) {
    console.log("Aucun credential connecteur — exit 0");
    return;
  }

  console.log(`Sync connecteurs : ${rows.length} credential(s) à traiter`);

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const connectorId = providerToConnectorId(row.provider);
    const label = connectorId ?? row.provider;

    try {
      const result = await syncConnectorForProject(row.userId, row.projectId, row.provider);
      if (result.status === "synced") {
        synced += 1;
        console.log(`✓ ${label} · projet ${row.projectId}`);
      } else if (result.status === "skipped") {
        skipped += 1;
        console.log(`– ${label} · projet ${row.projectId} (${result.reason})`);
      } else {
        errors += 1;
        console.error(`✗ ${label} · projet ${row.projectId} : ${result.message}`);
      }
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${label} · projet ${row.projectId} : ${message}`);
    }
  }

  console.log(`Terminé — synced=${synced} skipped=${skipped} errors=${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
