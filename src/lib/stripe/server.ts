import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe serveur (singleton lazy). Ne JAMAIS exposer la cle secrete au client.
 * apiVersion pinnee sur celle embarquee par le SDK installe (cf. node_modules/stripe).
 */
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
      appInfo: { name: "SaaS Radar" },
    });
  }
  return stripeClient;
}
