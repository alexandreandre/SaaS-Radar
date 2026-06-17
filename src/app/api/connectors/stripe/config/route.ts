import { NextResponse } from "next/server";
import { isStripeConnectConfigured } from "@/lib/connectors/stripe/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Indique si le bouton OAuth Stripe est disponible (STRIPE_CONNECT_CLIENT_ID). */
export async function GET() {
  return NextResponse.json({
    oauthConfigured: isStripeConnectConfigured(),
  });
}
