"use client";

import { PlaybookContent } from "@/components/cockpit/playbook/playbook-content";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function PlaybookModule({
  opportunity,
  project,
  data,
  onModuleChange,
}: CockpitModuleProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <PlaybookContent
        opportunity={opportunity}
        project={project}
        data={data}
        onModuleChange={onModuleChange}
        syncTabToUrl
      />
    </section>
  );
}
