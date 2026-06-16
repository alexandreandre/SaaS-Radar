import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { getCurrentUser, getProfile } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

/** Cree une session Stripe Customer Portal et redirige (form POST depuis /account). */
export async function POST(request: Request) {
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);
  if (!user) {
    return NextResponse.redirect(
      new URL("/login?next=/account", resolveOrigin(request)),
      { status: 303 }
    );
  }

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    // Aucun abonnement Stripe lie : renvoyer vers les tarifs.
    return NextResponse.redirect(
      new URL("/pricing", resolveOrigin(request)),
      { status: 303 }
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${resolveOrigin(request)}/account`,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.redirect(
      new URL("/account?portal=error", resolveOrigin(request)),
      { status: 303 }
    );
  }
}
