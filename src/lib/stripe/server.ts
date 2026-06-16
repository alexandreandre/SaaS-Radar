import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe serveur (singleton). Ne JAMAIS exposer la cle secrete au client.
 * apiVersion pinnee sur celle embarquee par le SDK installe (cf. node_modules/stripe).
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
  appInfo: { name: "SaaS Radar" },
});
