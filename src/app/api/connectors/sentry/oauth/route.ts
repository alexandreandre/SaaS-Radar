import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { assertProjectOwnedByUser } from "@/lib/connectors/project-access";
import {
  getSentryExternalInstallUrl,
  isSentryConfigured,
} from "@/lib/connectors/sentry/oauth";

import { SENTRY_OAUTH_COOKIE_MAX_AGE, SENTRY_OAUTH_STATE_COOKIE } from "@/lib/connectors/sentry/oauth-state";

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

  if (!isSentryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Sentry OAuth non configuré (SENTRY_CLIENT_ID, SENTRY_CLIENT_SECRET, SENTRY_REDIRECT_URI, SENTRY_APP_SLUG)",
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    await assertProjectOwnedByUser(user.id, projectId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Accès refusé" },
      { status: 403 },
    );
  }

  const state = Buffer.from(JSON.stringify({ projectId, userId: user.id })).toString(
    "base64url",
  );

  const cookieStore = await cookies();
  cookieStore.set(SENTRY_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SENTRY_OAUTH_COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.redirect(getSentryExternalInstallUrl());
}