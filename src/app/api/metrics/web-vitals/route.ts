import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebVitalPayload = {
  name?: string;
  value?: number;
  rating?: string;
  path?: string;
};

/** Collecte Web Vitals (LCP, INP, TTFB…) — log structuré pour agrégation Vercel/Datadog. */
export async function POST(request: Request) {
  let body: WebVitalPayload = {};
  try {
    body = (await request.json()) as WebVitalPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (body.name && typeof body.value === "number") {
    console.info(
      JSON.stringify({
        type: "web_vital",
        name: body.name,
        value: body.value,
        rating: body.rating ?? null,
        path: body.path ?? null,
      }),
    );
  }

  return NextResponse.json({ ok: true });
}
