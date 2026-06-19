import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { VercelConnectorError } from "@/lib/connectors/vercel/client";
import { detectHostLogo } from "@/lib/build/detect-host-logo";
import { buildProductLogo } from "@/lib/build/product-logo";
import {
  listVercelProjectsForUser,
  runVercelSync,
} from "@/lib/connectors/vercel/sync-service";

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
  const action = b.action === "list_projects" ? "list_projects" : "sync";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Accès refusé" },
      { status: 403 },
    );
  }

  try {
    if (action === "list_projects") {
      const projects = await listVercelProjectsForUser(user.id, projectId);
      return NextResponse.json({ projects });
    }

    const vercelProjectId =
      typeof b.vercelProjectId === "string" ? b.vercelProjectId.trim() : undefined;
    const sync = await runVercelSync(user.id, projectId, vercelProjectId);

    let productLogo;
    if (sync.connection.productionUrl) {
      const logoUrl = await detectHostLogo(sync.connection.productionUrl);
      if (logoUrl) productLogo = buildProductLogo(logoUrl, "host");
    }

    return NextResponse.json({
      accountLabel: sync.accountLabel,
      stream: sync.stream,
      connection: sync.connection,
      syncedAt: sync.syncedAt,
      productLogo,
    });
  } catch (err) {
    const status = err instanceof VercelConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Erreur Vercel";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
