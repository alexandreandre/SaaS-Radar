import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  BetterStackConnectorError,
  listAllMonitors,
  parseBetterStackCredential,
} from "@/lib/connectors/better-stack/client";
import { runBetterStackSync, saveBetterStackCredential } from "@/lib/connectors/better-stack/sync-service";
import { isCredentialsEncryptionConfigured } from "@/lib/crypto/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isCredentialsEncryptionConfigured()) {
    return NextResponse.json(
      { error: "Chiffrement des credentials non configuré (CREDENTIALS_ENCRYPTION_KEY)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const apiToken = typeof b.apiToken === "string" ? b.apiToken.trim() : "";
  const monitorId = typeof b.monitorId === "string" ? b.monitorId.trim() : "";
  const monitorName = typeof b.monitorName === "string" ? b.monitorName.trim() : null;
  const monitorUrl = typeof b.monitorUrl === "string" ? b.monitorUrl.trim() : null;
  const teamName = typeof b.teamName === "string" ? b.teamName.trim() : null;

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiToken || !monitorId) {
    return NextResponse.json({ error: "apiToken et monitorId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);

    let resolvedName = monitorName;
    let resolvedUrl = monitorUrl;
    let resolvedTeam = teamName;

    if (!resolvedName || !resolvedUrl) {
      const monitors = await listAllMonitors({ apiToken });
      const selected = monitors.find((monitor) => monitor.id === monitorId);
      if (selected) {
        resolvedName = resolvedName ?? selected.name;
        resolvedUrl = resolvedUrl ?? selected.url;
        resolvedTeam = resolvedTeam ?? selected.teamName;
      }
    }

    const credential = parseBetterStackCredential({
      apiToken,
      monitorId,
      monitorName: resolvedName,
      monitorUrl: resolvedUrl,
      teamName: resolvedTeam,
    });

    const { accountLabel } = await saveBetterStackCredential(user.id, projectId, credential);
    const sync = await runBetterStackSync(user.id, projectId);

    return NextResponse.json({
      accountLabel,
      stream: sync.stream,
      syncedAt: sync.syncedAt,
    });
  } catch (err) {
    const status = err instanceof BetterStackConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur connecteur Better Stack";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
