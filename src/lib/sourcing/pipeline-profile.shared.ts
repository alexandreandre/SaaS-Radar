export type PipelineProfile = "standard" | "catalogue";

export function isCatalogueProfile(options: {
  pipelineProfile?: PipelineProfile;
  config?: Record<string, unknown>;
}): boolean {
  if (options.pipelineProfile === "catalogue") return true;
  return options.config?.pipelineProfile === "catalogue";
}
