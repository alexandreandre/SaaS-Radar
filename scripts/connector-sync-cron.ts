/**
 * Cron prod : synchronise tous les connecteurs éligibles (credentials Supabase).
 */
import { listAllConnectorCredentials } from "../src/lib/connectors/credentials-store";
import { providerToConnectorId, syncConnectorForProject } from "../src/lib/connectors/sync-orchestrator";
import { isCredentialsEncryptionConfigured } from "../src/lib/crypto/credentials";

async function main(): Promise<void> {
  if (!isCredentialsEncryptionConfigured()) {
    console.error("CREDENTIALS_ENCRYPTION_KEY requis — exit 1");
    process.exit(1);
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
