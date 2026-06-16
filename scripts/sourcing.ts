/**
 * Usage : npm run sourcing -- --count=3 [--sector=healthcare] [--premium]
 * Prérequis : .env.local avec OPENROUTER_API_KEY + Supabase (service role) + migration appliquée.
 *
 * Pipeline 2 temps : Sonar (recherche web factuelle) → Gemini (structuration) → Zod → upsert.
 * Wrapper mince : toute l'orchestration vit dans src/lib/sourcing/run.ts (réutilisable par l'API admin).
 */
import { DEFAULT_COUNT, SECTORS } from "../src/lib/sourcing/constants";
import { runSourcing } from "../src/lib/sourcing/run";

interface Args {
  count: number;
  sector?: string;
  premium: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let count = DEFAULT_COUNT;
  let sector: string | undefined;
  let premium = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--count=")) {
      count = Number.parseInt(arg.slice("--count=".length), 10) || DEFAULT_COUNT;
    } else if (arg === "--count") {
      count = Number.parseInt(argv[++i] ?? "", 10) || DEFAULT_COUNT;
    } else if (arg.startsWith("--sector=")) {
      sector = arg.slice("--sector=".length);
    } else if (arg === "--sector") {
      sector = argv[++i];
    } else if (arg === "--premium") {
      premium = true;
    }
  }

  if (sector && !(SECTORS as readonly string[]).includes(sector)) {
    throw new Error(
      `--sector invalide : "${sector}". Valeurs autorisées : ${SECTORS.join(", ")}`
    );
  }

  return { count, sector, premium };
}

async function main(): Promise<void> {
  const { count, sector, premium } = parseArgs();
  await runSourcing({ count, sector, premium });
}

main().catch((err) => {
  console.error("❌ Sourcing échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
