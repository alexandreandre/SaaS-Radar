import type { UserProject } from "@/lib/portfolio";

export function queueProjectMetricsSync(project: UserProject) {
  if (typeof window === "undefined") return;

  void fetch("/api/portfolio/metrics", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: project.id,
      opportunitySlug: project.opportunitySlug,
      phase: project.phase,
      currentMrr: project.currentMrr,
      metricsHistory: project.metricsHistory ?? [],
      mrrHistory: project.mrrHistory,
      lastCheckInAt: project.lastCheckInAt,
      checkInStreak: project.checkInStreak,
    }),
  }).catch(() => {});
}
