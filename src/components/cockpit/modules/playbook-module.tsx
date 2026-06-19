"use client";

import { PlaybookContent } from "@/components/cockpit/playbook/playbook-content";
import { IdeaBriefModule } from "@/components/cockpit/idea/idea-brief-module";
import { IdeaBriefPlaceholder } from "@/components/cockpit/idea/idea-brief-placeholder";
import { usesIdeaPlaybookModule } from "@/lib/portfolio";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

export function PlaybookModule(props: CockpitModuleProps) {
  if (usesIdeaPlaybookModule(props.project)) {
    if (props.project.ideaBrief) {
      return <IdeaBriefModule {...props} />;
    }
    return <IdeaBriefPlaceholder {...props} />;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <PlaybookContent
        opportunity={props.opportunity}
        project={props.project}
        data={props.data}
        onModuleChange={props.onModuleChange}
        syncTabToUrl
      />
    </section>
  );
}
