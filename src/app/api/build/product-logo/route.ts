import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cockpitApiGuard } from "@/lib/product-phase-api";
import { detectHostLogo } from "@/lib/build/detect-host-logo";
import { buildProductLogo } from "@/lib/build/product-logo";
import {
  detectRepoLogo,
  getInstallationAccessToken,
  fetchRepoMetrics,
} from "@/lib/github/app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cockpitBlocked = await cockpitApiGuard();
  if (cockpitBlocked) return cockpitBlocked;

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
  const productionUrl =
    typeof b.productionUrl === "string" ? b.productionUrl.trim() : "";

  const github =
    b.github && typeof b.github === "object"
      ? (b.github as Record<string, unknown>)
      : null;
  const installationId =
    typeof github?.installationId === "number"
      ? github.installationId
      : parseInt(String(github?.installationId ?? ""), 10);
  const repoFullName =
    typeof github?.repoFullName === "string" ? github.repoFullName.trim() : "";

  try {
    if (productionUrl) {
      const logoUrl = await detectHostLogo(productionUrl);
      if (logoUrl) {
        return NextResponse.json({ productLogo: buildProductLogo(logoUrl, "host") });
      }
    }

    if (Number.isFinite(installationId) && repoFullName.includes("/")) {
      const token = await getInstallationAccessToken(installationId);
      const [owner, repo] = repoFullName.split("/");
      const metrics = await fetchRepoMetrics(token, owner, repo);
      const logoUrl = await detectRepoLogo(token, owner, repo, metrics.defaultBranch);
      if (logoUrl) {
        return NextResponse.json({ productLogo: buildProductLogo(logoUrl, "github") });
      }
    }

    return NextResponse.json({ productLogo: null });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur de détection" },
      { status: 500 },
    );
  }
}
