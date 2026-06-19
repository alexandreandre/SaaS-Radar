import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  fetchStores,
  LemonSqueezyConnectorError,
} from "@/lib/connectors/lemon-squeezy/client";
import { parseLemonSqueezyApiKey } from "@/lib/connectors/lemon-squeezy/keys";

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
    const apiKey = parseLemonSqueezyApiKey(apiKeyRaw);
    const stores = await fetchStores(apiKey);

    if (stores.length === 0) {
      return NextResponse.json(
        { error: "Aucune boutique trouvée pour cette clé API Lemon Squeezy." },
        { status: 404 },
      );
    }

    return NextResponse.json({ stores });
  } catch (err) {
    const status = err instanceof LemonSqueezyConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Lemon Squeezy échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
