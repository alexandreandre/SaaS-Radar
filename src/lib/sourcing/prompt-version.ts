export const PROMPT_VERSION = "v2";

export function withPromptVersion(config: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...config, prompt_version: PROMPT_VERSION };
}
