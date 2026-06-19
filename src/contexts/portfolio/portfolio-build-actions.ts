import {
  resetBuildSetup,
  restoreBuildSetupSnapshot,
  setBuildSetup,
  switchBuildTool,
  setBuildDevLevel as applyBuildDevLevel,
  setBuildPromptLanguage as applyBuildPromptLanguage,
  type BuildDevLevel,
  type BuildSetup,
  type ProductLogo,
  type ResetBuildOptions,
} from "@/lib/portfolio";
import type { BuildToolId } from "@/lib/build/tools";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createBuildActions(deps: PortfolioActionDeps) {
  const setBuildSetupForProject = (id: string, setup: BuildSetup) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = setBuildSetup(project, setup);
          return updated;
        }),
      );
    };

  const switchBuildToolForProject = (id: string, toolId: BuildToolId) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = switchBuildTool(project, toolId);
          return updated;
        }),
      );
    };

  const setBuildDevLevel = (id: string, level: BuildDevLevel) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = applyBuildDevLevel(project, level);
          return updated;
        }),
      );
    };

  const setBuildPromptLanguage = (id: string, language: BuildPromptLanguage) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = applyBuildPromptLanguage(project, language);
          return updated;
        }),
      );
    };

  const setProductName = (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = { ...project, productName: trimmed };
          return updated;
        }),
      );
    };

  const setProductLogo = (id: string, logo: ProductLogo | undefined) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = { ...project, productLogo: logo };
          return updated;
        }),
      );
    };

  const restoreBuildVersion = (id: string, savedAt: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const restored = restoreBuildSetupSnapshot(project, savedAt);
          if (!restored) return project;
          return restored;
        }),
      );
    };

  const resetBuild = (id: string, opts?: ResetBuildOptions) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = resetBuildSetup(project, opts);
          return updated;
        }),
      );
    };
  return {
    setBuildSetupForProject,
    switchBuildTool: switchBuildToolForProject,
    setBuildDevLevel,
    setBuildPromptLanguage,
    setProductName,
    setProductLogo,
    restoreBuildVersion,
    resetBuild,
  };
}
