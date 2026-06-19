import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { enqueueConnectorSyncJob } from "@/lib/connectors/sync-jobs";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-error-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.string().min(1),
  provider: z.string().min(1),
});

/** Enfile une sync connecteur (traitée par le worker cron). */
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const jobId = await enqueueConnectorSyncJob(
      user.id,
      parsed.data.projectId,
      parsed.data.provider,
    );
    return NextResponse.json({ ok: true, jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return apiErrorResponse("/api/connectors/sync/enqueue", 500, message);
  }
}
