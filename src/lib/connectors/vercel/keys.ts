import type { VercelCredential } from "@/lib/connectors/vercel/types";

export function parseVercelCredential(input: unknown): VercelCredential {
  const b = input as Record<string, unknown>;
  const accessToken = typeof b.accessToken === "string" ? b.accessToken.trim() : "";
  if (!accessToken) {
    throw new Error("Token Vercel manquant — reconnectez via OAuth");
  }

  const vercelProjectId =
    typeof b.vercelProjectId === "string" ? b.vercelProjectId.trim() : undefined;
  const projectName =
    typeof b.projectName === "string" ? b.projectName.trim() : undefined;

  return {
    accessToken,
    teamId: typeof b.teamId === "string" ? b.teamId : b.teamId === null ? null : undefined,
    userId: typeof b.userId === "string" ? b.userId : b.userId === null ? null : undefined,
    vercelProjectId: vercelProjectId || null,
    projectName: projectName || null,
  };
}
