import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/newsletter/unsubscribe?email=xxx
 *
 * Appelé quand un abonné clique sur le lien de désabonnement dans la newsletter.
 * Pour les campagnes Brevo, l'email est injecté via le merge tag {{ contact.EMAIL }}.
 * Met à jour la table newsletter_subscribers (status='unsubscribed') et redirige
 * vers une page de confirmation.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("email", email);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://thebuildroad.com";

  return NextResponse.redirect(
    new URL(`/newsletter?unsubscribed=1`, baseUrl.replace(/\/$/, ""))
  );
}
