import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  buildAccountMetaFromMe,
  fetchMe,
  PennylaneConnectorError,
} from "@/lib/connectors/pennylane/client";
import { parsePennylaneApiToken } from "@/lib/connectors/pennylane/keys";
import { isPennylaneOAuthConfigured } from "@/lib/connectors/pennylane/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    oauthConfigured: isPennylaneOAuthConfigured(),
  });
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
  const projectId = typeof b.projectId === "string" ? b.projectId.trim() : "";
  const apiToken = typeof b.apiToken === "string" ? b.apiToken.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiToken) {
    return NextResponse.json({ error: "apiToken requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const parsedToken = parsePennylaneApiToken(apiToken);
    const me = await fetchMe({ authType: "company_token", apiToken: parsedToken });
    const meta = buildAccountMetaFromMe(me);

    return NextResponse.json({
      accountLabel: meta.accountLabel,
      companyId: meta.companyId,
      companyName: meta.companyName,
      scopes: meta.scopes,
      sandbox: meta.sandbox,
      hasTrialBalanceScope: meta.hasTrialBalanceScope,
      oauthConfigured: isPennylaneOAuthConfigured(),
    });
  } catch (err) {
    const status = err instanceof PennylaneConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Pennylane échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
