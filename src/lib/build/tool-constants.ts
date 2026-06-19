import { BUILD_TOOLS, type BuildToolId } from "@/lib/build/tools";

export const BUILD_TOOL_ID_REMAP: Partial<Record<string, BuildToolId>> = {
  windsurf: "codex",
};

const VALID_TOOL_IDS = new Set(BUILD_TOOLS.map((t) => t.id));

export function remapBuildToolId(id: string | undefined): BuildToolId | undefined {
  if (!id) return undefined;
  const remapped = (BUILD_TOOL_ID_REMAP[id] ?? id) as BuildToolId;
  return VALID_TOOL_IDS.has(remapped) ? remapped : undefined;
}

export const TOOLS_WITH_PLAN_MODE: ReadonlySet<BuildToolId> = new Set<BuildToolId>([
  "cursor",
  "claude-code",
  "codex",
  "replit",
  "bolt",
  "emergent",
]);

/** Remplace les mentions Windsurf dans les kits migrés. */
export function replaceLegacyToolNamesInText(text: string): string {
  return text.replace(/\bWindsurf\b/g, "Codex").replace(/\bwindsurf\b/g, "codex");
}
