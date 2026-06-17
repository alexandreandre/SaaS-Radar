import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { DevStream } from "@/lib/connectors/streams";
import {
  fetchRepoMetrics,
  getInstallationAccessToken,
  listInstallationRepos,
  detectRepoLogo,
} from "@/lib/github/app";
import { buildProductLogo } from "@/lib/build/product-logo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function metricsToDevStream(m: Awaited<ReturnType<typeof fetchRepoMetrics>>): DevStream {
  const commitsDelta = m.commitsLast7d - m.commitsPrev7d;
  let healthScore = 70;
  if (m.lastWorkflowConclusion === "success") healthScore += 15;
  if (m.lastWorkflowConclusion === "failure") healthScore -= 25;
  if (m.commitsLast7d > 0) healthScore += 10;
  if (m.commitsLast7d === 0) healthScore -= 20;
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    type: "dev",
    deploysLast30d: m.deploysLast30d,
    openIssues: m.openIssues,
    errorRate: m.lastWorkflowConclusion === "failure" ? 2.5 : 0,
    uptimePct: m.lastWorkflowConclusion === "failure" ? 98 : 99.9,
    commitsLast7d: m.commitsLast7d,
    commitsDelta,
    openPrs: m.openPrs,
    stars: m.stars,
    lastWorkflowConclusion: m.lastWorkflowConclusion,
    viewsLast14d: m.viewsLast14d,
    defaultBranch: m.defaultBranch,
    lastPushAt: m.lastPushAt,
    repoFullName: m.repoFullName,
    healthScore,
  };
}

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
  const installationId =
    typeof b.installationId === "number"
      ? b.installationId
      : parseInt(String(b.installationId ?? ""), 10);
  const repoFullName = typeof b.repoFullName === "string" ? b.repoFullName.trim() : "";
  const action = b.action === "list_repos" ? "list_repos" : "sync";

  if (!Number.isFinite(installationId)) {
    return NextResponse.json({ error: "installationId invalide" }, { status: 400 });
  }

  try {
    const token = await getInstallationAccessToken(installationId);

    if (action === "list_repos") {
      const repos = await listInstallationRepos(token);
      return NextResponse.json({ repos });
    }

    if (!repoFullName.includes("/")) {
      return NextResponse.json({ error: "repoFullName invalide" }, { status: 400 });
    }

    const [owner, repo] = repoFullName.split("/");
    const metrics = await fetchRepoMetrics(token, owner, repo);
    const stream = metricsToDevStream(metrics);

    const logoUrl = await detectRepoLogo(token, owner, repo, metrics.defaultBranch);
    const productLogo = logoUrl ? buildProductLogo(logoUrl, "github") : undefined;

    return NextResponse.json({
      connection: {
        repoFullName,
        installationId,
        connectedAt: new Date().toISOString(),
      },
      stream,
      metrics,
      productLogo,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur GitHub" },
      { status: 500 },
    );
  }
}
