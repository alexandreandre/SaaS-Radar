/**
 * Usage : npm run sourcing -- --count=3 --country=US [--sector=healthcare] [--premium] [--direct]
 */
import { DEFAULT_COUNT, SECTORS } from "../src/lib/sourcing/constants";
import { runSourcing } from "../src/lib/sourcing/run";
import {
  assertValidCountryCode,
  DEFAULT_SOURCING_COUNTRY,
} from "../src/lib/sourcing/countries";

interface Args {
  count: number;
  country: string;
  sector?: string;
  premium: boolean;
  mode: "draft" | "direct";
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  let count = DEFAULT_COUNT;
  let country = DEFAULT_SOURCING_COUNTRY;
  let sector: string | undefined;
  let premium = false;
  let mode: "draft" | "direct" = "draft";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--count=")) {
      count = Number.parseInt(arg.slice("--count=".length), 10) || DEFAULT_COUNT;
    } else if (arg === "--count") {
      count = Number.parseInt(argv[++i] ?? "", 10) || DEFAULT_COUNT;
    } else if (arg.startsWith("--country=")) {
      country = arg.slice("--country=".length);
    } else if (arg === "--country") {
      country = argv[++i] ?? DEFAULT_SOURCING_COUNTRY;
    } else if (arg.startsWith("--sector=")) {
      sector = arg.slice("--sector=".length);
    } else if (arg === "--sector") {
      sector = argv[++i];
    } else if (arg === "--premium") {
      premium = true;
    } else if (arg === "--direct") {
      mode = "direct";
    } else if (arg.startsWith("--mode=")) {
      const m = arg.slice("--mode=".length);
      if (m === "direct" || m === "draft") mode = m;
    }
  }

  if (sector && !(SECTORS as readonly string[]).includes(sector)) {
    throw new Error(
      `--sector invalide : "${sector}". Valeurs autorisées : ${SECTORS.join(", ")}`
    );
  }

  return { count, country, sector, premium, mode };
}

async function main(): Promise<void> {
  const { count, country, sector, premium, mode } = parseArgs();
  const resolved = await assertValidCountryCode(country);

  if (mode === "direct") {
    console.warn(
      "⚠ Mode direct : publication sans file d'approbation. Réservé au dev — préférez --mode=draft."
    );
  }

  console.log(`Sourcing ${count} fiche(s) — pays ${resolved.flag} ${resolved.name} (${resolved.code})`);

  await runSourcing({
    count,
    sector,
    premium,
    mode,
    originCountryCode: resolved.code,
    manageWeeklyPick: false,
  });
}

main().catch((err) => {
  console.error("❌ Sourcing échoué :", err instanceof Error ? err.message : err);
  process.exit(1);
});
