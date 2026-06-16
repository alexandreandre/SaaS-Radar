import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceIdToPlan } from "@/lib/billing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createAdminClient>;

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function findProfileIdByCustomer(
  admin: AdminClient,
  customerId: string
): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Applique l'etat d'une subscription Stripe sur le profil (service-role).
 * Resolution robuste a l'ordre des events : par stripe_customer_id, puis fallback
 * par metadata.supabase_uid (et on repare alors le lien customer<->profil).
 */
async function applySubscription(
  admin: AdminClient,
  sub: Stripe.Subscription,
  fallbackUid: string | null,
  forceFree = false
): Promise<void> {
  const customerId = customerIdOf(sub.customer);
  const item = sub.items.data[0];
  const mappedPlan = priceIdToPlan(item?.price?.id);
  const status = sub.status;
  // active/trialing/past_due conservent l'acces (grace) ; le reste retombe en free.
  const keepsAccess =
    status === "active" || status === "trialing" || status === "past_due";
  const plan = forceFree || !keepsAccess || !mappedPlan ? "free" : mappedPlan;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;

  let targetId: string | null = customerId
    ? await findProfileIdByCustomer(admin, customerId)
    : null;
  if (!targetId) {
    targetId =
      fallbackUid ??
      (sub.metadata?.supabase_uid as string | undefined) ??
      null;
  }
  if (!targetId) {
    console.warn(
      `[stripe/webhook] profil introuvable pour subscription ${sub.id} (customer ${customerId})`
    );
    return;
  }

  await admin
    .from("profiles")
    .update({
      plan,
      subscription_status: status,
      current_period_end: periodEnd,
      stripe_customer_id: customerId ?? undefined,
      stripe_subscription_id: sub.id,
    })
    .eq("id", targetId);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook non configure" }, { status: 400 });
  }

  // Body BRUT obligatoire pour la verification de signature.
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature invalide", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotence : si l'event a deja ete enregistre (PK conflict), ne pas retraiter.
  const { error: idemError } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (idemError) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const fallbackUid =
          session.client_reference_id ??
          (session.metadata?.supabase_uid as string | undefined) ??
          null;
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(admin, sub, fallbackUid);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(
          admin,
          sub,
          (sub.metadata?.supabase_uid as string | undefined) ?? null
        );
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(
          admin,
          sub,
          (sub.metadata?.supabase_uid as string | undefined) ?? null,
          true // downgrade -> free
        );
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = customerIdOf(invoice.customer);
        if (customerId) {
          const targetId = await findProfileIdByCustomer(admin, customerId);
          if (targetId) {
            // Grace : on marque past_due mais on garde le plan jusqu'a deleted/unpaid.
            await admin
              .from("profiles")
              .update({ subscription_status: "past_due" })
              .eq("id", targetId);
          }
        }
        break;
      }
      default:
        // Event non gere : 200 quand meme (deja enregistre pour idempotence).
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] echec traitement ${event.type}`, err);
    return NextResponse.json({ error: "Traitement echoue" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
