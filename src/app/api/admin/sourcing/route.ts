import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { SECTORS } from "@/lib/sourcing/constants";
import { getMinScore } from "@/lib/sourcing/assemble";
import {
  listSourcingRuns,
  listActiveSourcingRuns,
  recoverStaleRuns,
  startSourcingBatch,
  getSourcingRun,
} from "@/lib/admin/sourcing-jobs";
import { kickSourcingExecution, recoverStuckQueueJobs } from "@/lib/admin/process-sourcing-queue";
import { runSourcing } from "@/lib/sourcing/run";
import { OPPORTUNITIES_CACHE_TAG } from "@/lib/opportunities";
import {
  assertValidCountryCodes,
  MAX_COUNTRIES_PER_BATCH,
} from "@/lib/sourcing/countries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const runId = url.searchParams.get("runId");

  try {
    if (runId) {
      const run = await getSourcingRun(runId);
      return NextResponse.json({ run });
    }
    await recoverStaleRuns();
    await recoverStuckQueueJobs();
    const [runs, activeRuns] = await Promise.all([
      listSourcingRuns(20),
      listActiveSourcingRuns(),
    ]);
    return NextResponse.json({ runs, activeRuns });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, {
    minimumRole: "editor",
    requireEdit: true,
    rateLimitKey: "admin:sourcing:launch",
    rateLimitMax: 10,
  });
  if (auth instanceof NextResponse) return auth;

  let body: {
    action?: unknown;
    count?: unknown;
    countries?: unknown;
    sector?: unknown;
    premium?: unknown;
    minScore?: unknown;
    mode?: unknown;
    async?: unknown;
    maxCostUsd?: unknown;
    maxJobs?: unknown;
  } = {};
  try {
    body = await request.json();
  } catch {
    // defaults
  }

  if (body.action === "processQueue") {
    return NextResponse.json(
      { error: "Utilisez POST /api/admin/sourcing/process-queue" },
      { status: 410 }
    );
  }

  const count = Number.parseInt(String(body.count ?? 3), 10);
  if (!Number.isFinite(count) || count < 1 || count > 10) {
    return NextResponse.json({ error: "count doit être entre 1 et 10" }, { status: 400 });
  }

  if (!Array.isArray(body.countries) || body.countries.length === 0) {
    return NextResponse.json(
      { error: "countries requis — sélectionnez au moins un pays" },
      { status: 400 }
    );
  }

  const countryInputs = body.countries.map(String);
  if (countryInputs.length > MAX_COUNTRIES_PER_BATCH) {
    return NextResponse.json(
      { error: `Maximum ${MAX_COUNTRIES_PER_BATCH} pays par lancement` },
      { status: 400 }
    );
  }

  let resolvedCountries;
  try {
    resolvedCountries = await assertValidCountryCodes(countryInputs);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }

  let sector: string | undefined;
  if (body.sector != null && body.sector !== "") {
    sector = String(body.sector);
    if (!(SECTORS as readonly string[]).includes(sector)) {
      return NextResponse.json({ error: "sector invalide" }, { status: 400 });
    }
  }

  const premium = body.premium === true;
  const isAsync = body.async !== false;
  const maxCostUsd =
    body.maxCostUsd != null ? Number.parseFloat(String(body.maxCostUsd)) : undefined;
  const mode = body.mode === "draft" ? "draft" : "direct";
  const catalogue = mode === "direct";
  const minScore = catalogue ? 0 : body.minScore != null ? Number.parseInt(String(body.minScore), 10) : getMinScore();

  const config = {
    count,
    countries: resolvedCountries.map((c) => c.code),
    sector,
    premium,
    minScore,
    mode,
    ...(catalogue ? { pipelineProfile: "catalogue" as const } : {}),
  };

  try {
    if (isAsync) {
      const { runIds, batchId, countries } = await startSourcingBatch({
        countries: resolvedCountries.map((c) => c.code),
        count,
        sector,
        premium,
        minScore,
        mode,
        maxCostUsd,
        triggeredBy: auth.ctx.userId === "machine" ? undefined : auth.ctx.userId,
        config,
        revalidate: catalogue,
        manageWeeklyPick: false,
      });

      await withAdminAudit(auth.ctx, {
        action: "sourcing.start",
        targetType: "sourcing_run",
        targetId: runIds[0] ?? null,
        metadata: config,
      });

      const origin = new URL(request.url).origin;
      kickSourcingExecution({ runIds, origin });

      return NextResponse.json({
        runIds,
        batchId,
        runId: runIds[0],
        countries: countries.map((c) => c.code),
        async: true,
        started: true,
        message: `Sourcing lancé — ${countries.map((c) => c.code).join(", ")}`,
      });
    }

    const reports = [];
    for (const country of resolvedCountries) {
      const report = await runSourcing({
        count,
        sector,
        premium,
        minScore,
        mode,
        originCountryCode: country.code,
        triggeredBy: auth.ctx.userId === "machine" ? undefined : auth.ctx.userId,
        config: { ...config, originCountryCode: country.code },
        revalidate: false,
        manageWeeklyPick: false,
      });
      reports.push(report);
    }

    const totalWritten = reports.reduce((sum, r) => sum + r.written, 0);
    if (totalWritten > 0 && mode === "direct") {
      revalidatePath("/");
      revalidateTag(OPPORTUNITIES_CACHE_TAG);
      revalidatePath("/opportunities", "page");
    }

    await withAdminAudit(auth.ctx, {
      action: "sourcing.complete",
      targetType: "sourcing_run",
      metadata: { reports: JSON.parse(JSON.stringify(reports)), config },
    });

    return NextResponse.json({ reports });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
