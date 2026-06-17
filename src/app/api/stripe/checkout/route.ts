import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPriceId,
  isBillingInterval,
  isPaidPlan,
} from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Origine absolue de l'app (success/cancel URLs). */
function resolveOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function POST(request: Request) {
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { plan, interval } = (body ?? {}) as {
    plan?: unknown;
    interval?: unknown;
  };

  if (!isPaidPlan(plan) || !isBillingInterval(interval)) {
    return NextResponse.json(
      { error: "Plan ou interval invalide" },
      { status: 400 }
    );
  }

  let priceId: string;
  try {
    priceId = getPriceId(plan, interval);
  } catch {
    return NextResponse.json(
      { error: "Tarification Stripe non configuree" },
      { status: 500 }
    );
  }

  const origin = resolveOrigin(request);
  const admin = createAdminClient();

  try {
    // 1. Customer : reutiliser celui du profil ou en creer un.
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_uid: user.id },
      });
      customerId = customer.id;
      // ANTI RACE CONDITION : persister le lien customer<->profil AVANT de
      // rediriger vers Stripe, sinon un event subscription.* peut arriver
      // avant que le profil connaisse son stripe_customer_id.
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // 2. Session Checkout hebergee (abonnement).
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      allow_promotion_codes: true,
      // supabase_uid dans la subscription pour resolution de secours cote webhook.
      subscription_data: { metadata: { supabase_uid: user.id } },
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Session Checkout sans URL" },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Impossible de demarrer le paiement" },
      { status: 500 }
    );
  }
}
