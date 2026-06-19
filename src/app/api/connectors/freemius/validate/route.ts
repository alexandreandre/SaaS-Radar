import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  fetchProduct,
  FreemiusConnectorError,
} from "@/lib/connectors/freemius/client";
import {
  parseFreemiusApiToken,
  parseFreemiusProductId,
} from "@/lib/connectors/freemius/keys";

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
  const productIdRaw = typeof b.productId === "string" ? b.productId.trim() : "";
  const apiTokenRaw = typeof b.apiToken === "string" ? b.apiToken.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!productIdRaw || !apiTokenRaw) {
    return NextResponse.json({ error: "productId et apiToken requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const productId = parseFreemiusProductId(productIdRaw);
    const apiToken = parseFreemiusApiToken(apiTokenRaw);
    const product = await fetchProduct(productId, apiToken);

    return NextResponse.json({ product });
  } catch (err) {
    const status = err instanceof FreemiusConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Freemius échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
