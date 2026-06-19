import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  FathomConnectorError,
  fetchSiteEvents,
  fetchSites,
  parseFathomCredential,
  validateCredential,
} from "@/lib/connectors/fathom/client";
import { parseFathomApiKey } from "@/lib/connectors/fathom/keys";

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
  const apiKey = typeof b.apiKey === "string" ? b.apiKey.trim() : "";
  const siteId = typeof b.siteId === "string" ? b.siteId.trim() : "";

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "apiKey requis" }, { status: 400 });
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
    const parsedKey = parseFathomApiKey(apiKey);

    if (!siteId) {
      const credential = { apiKey: parsedKey, siteId: "VALIDATE" };
      const sites = await fetchSites(credential);
      return NextResponse.json({
        sites: sites.map((site) => ({
          id: site.id,
          name: site.name,
          timezone: site.timezone,
        })),
      });
    }

    const credential = parseFathomCredential({ apiKey: parsedKey, siteId });
    const meta = await validateCredential(credential);

    let events: { id: string; name: string }[] = [];
    try {
      const eventList = await fetchSiteEvents(credential, credential.siteId);
      events = eventList.map((event) => ({
        id: event.id,
        name: event.name,
      }));
    } catch {
      // Events listing optional — user can skip signups
    }

    return NextResponse.json({
      accountLabel: meta.accountLabel,
      timezone: meta.timezone,
      events,
    });
  } catch (err) {
    const status = err instanceof FathomConnectorError && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : "Validation Fathom échouée";
    return NextResponse.json(
      { error: message },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
