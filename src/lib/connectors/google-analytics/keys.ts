import type { GoogleAnalyticsCredential } from "@/lib/connectors/google-analytics/types";

export function normalizePropertyId(propertyId: string): string {
  return propertyId.replace(/^properties\//, "").replace(/\D/g, "").trim();
}

export function parseGoogleAnalyticsConnectInput(input: {
  propertyId: string;
  propertyDisplayName?: string;
  signupEvent?: string | null;
  trialEvent?: string | null;
}): Pick<
  GoogleAnalyticsCredential,
  "propertyId" | "propertyDisplayName" | "signupEvent" | "trialEvent"
> {
  const propertyId = normalizePropertyId(input.propertyId);
  if (!propertyId || !/^\d+$/.test(propertyId)) {
    throw new Error("Property ID GA4 invalide — utilisez l'identifiant numérique de la propriété");
  }

  const signupEvent = input.signupEvent?.trim() || "sign_up";
  const trialEvent = input.trialEvent?.trim() || null;

  return {
    propertyId,
    propertyDisplayName: input.propertyDisplayName?.trim() || undefined,
    signupEvent,
    trialEvent,
  };
}
