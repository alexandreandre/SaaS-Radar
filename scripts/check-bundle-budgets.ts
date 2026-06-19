/**
 * Parse la sortie `next build` et vérifie les budgets First Load JS.
 * Usage : npm run build 2>&1 | tee /tmp/next-build.log && npx tsx scripts/check-bundle-budgets.ts /tmp/next-build.log
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

type BudgetFile = {
  routes: Record<string, { maxKb: number }>;
  regressionPercent: number;
};

const ROUTE_LINE =
  /^(?:┌|├|└)\s+[○ƒλ]\s+(\S+)\s+[\d.]+\s+(?:kB|B)\s+([\d.]+)\s+kB/;

function parseFirstLoadKb(log: string): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const line of log.split("\n")) {
    const match = line.match(ROUTE_LINE);
    if (!match) continue;
    let route = match[1]!;
    if (route.includes("[slug]") || route.includes("[id]")) continue;
    if (route === "/_not-found") continue;
    sizes.set(route, Number.parseFloat(match[2]!));
  }
  return sizes;
}

function loadBudgets(): BudgetFile {
  const path = resolve(scriptDir, "bundle-budgets.json");
  return JSON.parse(readFileSync(path, "utf8")) as BudgetFile;
}

function main(): void {
  const logPath = process.argv[2];
  if (!logPath) {
    console.error("Usage: tsx scripts/check-bundle-budgets.ts <next-build.log>");
    process.exit(1);
  }
  if (!existsSync(logPath)) {
    console.error(`Fichier introuvable: ${logPath}`);
    process.exit(1);
  }

  const log = readFileSync(logPath, "utf8");
  const sizes = parseFirstLoadKb(log);
  const budgets = loadBudgets();
  const failures: string[] = [];

  console.log("── Bundle budgets (First Load JS) ──");
  for (const [route, budget] of Object.entries(budgets.routes)) {
    const actual = sizes.get(route);
    if (actual == null) {
      console.warn(`  ⚠ ${route} : route absente du build log`);
      continue;
    }
    const ok = actual <= budget.maxKb;
    const icon = ok ? "✓" : "✗";
    console.log(`  ${icon} ${route}: ${actual} kB (max ${budget.maxKb} kB)`);
    if (!ok) {
      failures.push(`${route}: ${actual} kB > ${budget.maxKb} kB`);
    }
  }

  if (failures.length > 0) {
    console.error("\nBudget dépassé:\n" + failures.map((f) => `  - ${f}`).join("\n"));
    process.exit(1);
  }
  console.log("\nTous les budgets respectés.");
}

main();
