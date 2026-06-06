"use client";

import { useMemo } from "react";
import type { Opportunity } from "@/types/opportunity";
import { buildCockpitAlerts } from "@/lib/cockpit-alerts";
import { buildCockpitMetrics } from "@/lib/cockpit-metrics";
import {
  buildPromiseCurve,
  getMetricsHistory,
  getMilestoneProgress,
  getPromiseGapPercent,
  getTargetMrr,
  mergeRealityCurve,
  type UserProject,
} from "@/lib/portfolio";
import { buildStackHealth } from "@/lib/stack-health";
import { buildRadarActions } from "@/lib/radar-intelligence";

export function useCockpitData(project: UserProject, opportunity: Opportunity) {
  return useMemo(() => {
    const metrics = buildCockpitMetrics(project, opportunity);
    const alerts = buildCockpitAlerts(project, metrics, opportunity);
    const stackHealth = buildStackHealth(opportunity, project.integrations);
    const radarActions = buildRadarActions(project, opportunity, metrics, stackHealth);
    const history = getMetricsHistory(project);
    const promise = buildPromiseCurve(opportunity, project.targetScenario);
    const chartData = mergeRealityCurve(promise, project.mrrHistory, project.startedAt);
    const gap = getPromiseGapPercent(project);
    const target = getTargetMrr(project);
    const milestoneProgress = getMilestoneProgress(project);

    const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;

    return {
      metrics,
      alerts,
      stackHealth,
      radarActions,
      history,
      promise,
      chartData,
      gap,
      target,
      milestoneProgress,
      criticalAlerts,
    };
  }, [project, opportunity]);
}

export type CockpitData = ReturnType<typeof useCockpitData>;
