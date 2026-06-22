"use client";

import { Suspense } from "react";
import { Lock } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";
import type { BuildTool } from "@/lib/build/tools";
import { getUnifiedDeployStatus } from "@/lib/build/deploy-status";
import { shouldShowBuildTracking } from "@/lib/build/journey";
import {
  getBuildTrackingProfile,
  getBuildTrackingTeaserMessage,
} from "@/lib/build/tracking-profile";
import { BuildGithubTracking } from "@/components/cockpit/build/build-github-tracking";
import { BuildHostTracking } from "@/components/cockpit/build/build-host-tracking";
import { cn } from "@/lib/utils";

type BuildAppTrackingProps = {
  project: UserProject;
  tool?: BuildTool;
  opportunity?: Opportunity;
  onModuleChange?: (module: CockpitModuleId) => void;
};

function BuildTrackingTeaser({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium text-muted-foreground">Suivi de mon app</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </section>
  );
}

function BuildAppTrackingInner({
  project,
  tool,
  opportunity,
  onModuleChange,
}: BuildAppTrackingProps) {
  const profile = getBuildTrackingProfile(tool!);
  const deployStatus = getUnifiedDeployStatus(project);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
            Suivi
          </p>
          <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <LogoMark className="h-5" aria-hidden />
            Suivi de mon app
          </h3>
        </div>
        {deployStatus ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              deployStatus.status === "success" && "bg-emerald-500/10 text-emerald-600",
              deployStatus.status === "failure" && "bg-destructive/10 text-destructive",
              deployStatus.status === "pending" && "bg-amber-500/10 text-amber-600",
              deployStatus.status === "unknown" && "bg-muted text-muted-foreground",
            )}
          >
            {deployStatus.label}
          </span>
        ) : null}
      </div>

      <div className="space-y-4">
        {profile.host === "url-only" ? (
          <>
            <BuildHostTracking
              project={project}
              opportunity={opportunity}
              tool={tool}
              profile={profile}
              onModuleChange={onModuleChange}
              embedded
            />
            {profile.github !== "hidden" ? (
              <BuildGithubTracking
                project={project}
                opportunity={opportunity}
                tool={tool}
                mode={profile.github}
                embedded
              />
            ) : null}
          </>
        ) : (
          <>
            {profile.github !== "hidden" ? (
              <BuildGithubTracking
                project={project}
                opportunity={opportunity}
                tool={tool}
                mode={profile.github}
                embedded
              />
            ) : null}
            <BuildHostTracking
              project={project}
              opportunity={opportunity}
              tool={tool}
              profile={profile}
              onModuleChange={onModuleChange}
              embedded
            />
          </>
        )}
      </div>
    </section>
  );
}

export function BuildAppTracking(props: BuildAppTrackingProps) {
  if (!shouldShowBuildTracking(props.project)) {
    const teaserMessage = props.tool
      ? getBuildTrackingTeaserMessage(getBuildTrackingProfile(props.tool))
      : "Disponible après avoir généré votre kit de démarrage.";
    return <BuildTrackingTeaser message={teaserMessage} />;
  }

  if (!props.tool) {
    return (
      <BuildTrackingTeaser message="Sélectionnez un outil de build pour activer le suivi adapté." />
    );
  }

  return (
    <Suspense fallback={null}>
      <BuildAppTrackingInner {...props} />
    </Suspense>
  );
}
