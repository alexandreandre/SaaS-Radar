#!/usr/bin/env node
/** Pattern inner + dynamic pour charts Recharts cockpit. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const METRICS = path.join(ROOT, "src/components/cockpit/metrics");
const MRR = path.join(ROOT, "src/components/cockpit/mrr-trajectory-chart.tsx");

const targets = [
  ...fs
    .readdirSync(METRICS)
    .filter((f) => f.endsWith(".tsx") && !f.includes("-inner"))
    .map((f) => path.join(METRICS, f)),
  MRR,
];

const skeleton = `function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" aria-hidden />;
}
`;

for (const file of targets) {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes('from "recharts"')) continue;

  const exportMatch = content.match(/export function (\w+)/);
  if (!exportMatch) {
    console.warn("Skip (no named export):", file);
    continue;
  }
  const name = exportMatch[1];
  const innerName = `${name}Inner`;
  const dir = path.dirname(file);
  const base = path.basename(file, ".tsx");
  const innerPath = path.join(dir, `${base}-inner.tsx`);

  const innerContent = content.replace(
    `export function ${name}`,
    `export function ${innerName}`,
  );
  fs.writeFileSync(innerPath, innerContent);

  const relInner = `./${base}-inner`;
  const wrapper = `"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ${innerName} = dynamic(
  () => import("${relInner}").then((m) => ({ default: m.${innerName} })),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

${skeleton}

export function ${name}(props: ComponentProps<typeof ${innerName}>) {
  return <${innerName} {...props} />;
}
`;

  fs.writeFileSync(file, wrapper);
  console.log("Lazy:", base);
}

console.log("Done");
