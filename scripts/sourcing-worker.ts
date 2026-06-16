/**
 * Worker : consomme sourcing_job_queue et exécute les runs séquentiellement.
 * Usage : npx tsx scripts/sourcing-worker.ts [--once] [--max=10]
 */
import { processOneSourcingJob, processSourcingQueue } from "../src/lib/admin/process-sourcing-queue";

async function main(): Promise<void> {
  const once = process.argv.includes("--once");
  const maxArg = process.argv.find((a) => a.startsWith("--max="));
  const maxJobs = maxArg ? Number.parseInt(maxArg.slice("--max=".length), 10) : once ? 1 : 50;

  if (once) {
    const hadJob = await processOneSourcingJob();
    if (!hadJob) {
      console.log("Aucun job en attente — exit 0");
    } else {
      console.log("Worker terminé — 1 job traité.");
    }
    return;
  }

  const { processed } = await processSourcingQueue({ maxJobs });
  if (processed === 0) {
    console.log("Aucun job en attente — exit 0");
  }
  console.log(`Worker terminé — ${processed} job(s) traité(s).`);
}

main().catch((err) => {
  console.error("Worker sourcing échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
