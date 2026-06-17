import { NextResponse } from "next/server";
import { isStripeOAuthConfigured } from "@/lib/connectors/stripe/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Indique si le bouton OAuth Stripe Apps est disponible (STRIPE_APP_CLIENT_ID). */
export async function GET() {
  return NextResponse.json({
    oauthConfigured: isStripeOAuthConfigured(),
  });
}
