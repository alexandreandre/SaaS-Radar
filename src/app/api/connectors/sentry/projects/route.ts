import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import { SentryConnectorError } from "@/lib/connectors/sentry/client";
import {
  ensureFreshSentryCredential,
  fetchOrganizationProjects,
} from "@/lib/connectors/sentry/client";
import { loadSentryCredential } from "@/lib/connectors/sentry/sync-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const credential = await loadSentryCredential(user.id, projectId);
    if (!credential?.installationId) {
      return NextResponse.json(
        { error: "Sentry non autorisé — lancez d'abord la connexion OAuth" },
        { status: 400 },
      );
    }

    const { credential: freshCredential } = await ensureFreshSentryCredential(credential);
    const projects = await fetchOrganizationProjects(
      freshCredential,
      freshCredential.organizationSlug,
    );

    return NextResponse.json({
      organizationSlug: freshCredential.organizationSlug,
      projects: projects.map((project) => ({
        id: project.id,
        slug: project.slug,
        name: project.name,
        platform: project.platform,
      })),
    });
  } catch (err) {
    const status = err instanceof SentryConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Impossible de charger les projets Sentry";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
