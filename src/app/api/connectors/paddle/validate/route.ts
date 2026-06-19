import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  PaddleConnectorError,
  parsePaddleCredential,
  probePermissions,
} from "@/lib/connectors/paddle/client";
import { buildAccountLabel } from "@/lib/connectors/paddle/keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const apiKeyRaw = typeof b.apiKey === "string" ? b.apiKey.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKeyRaw) {
    return NextResponse.json({ error: "apiKey requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = parsePaddleCredential({ apiKey: apiKeyRaw });
    const permissions = await probePermissions(credential);

    return NextResponse.json({
      accountLabel: buildAccountLabel(credential),
      sandbox: credential.sandbox,
      permissions,
    });
  } catch (err) {
    const status = err instanceof PaddleConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Paddle échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
