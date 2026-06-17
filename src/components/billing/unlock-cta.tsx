import Link from "next/link";
import { Button } from "@/components/ui/button";
import { nextTierFor, tierPrices, type Tier } from "@/lib/tier";

export function UnlockCta({
  requiredTier,
  label,
  size = "default",
}: {
  requiredTier: Exclude<Tier, "free">;
  label?: string;
  size?: "default" | "sm" | "lg";
}) {
  const price = tierPrices[requiredTier];
  const planName = requiredTier === "pro" ? "Pro" : "Builder";
  const text = label ?? `Voir l'abonnement ${planName} — ${price}`;

  return (
    <Button size={size} asChild>
      <Link href="/mes-saas">{text}</Link>
    </Button>
  );
}

export function unlockMessage(requiredTier: Tier): string {
  if (requiredTier === "free") return "";
  const tier = nextTierFor(requiredTier);
  return tier === "pro"
    ? "Passez en Pro pour coller le prompt, les emails et les contacts partenaires."
    : "Passez en Builder pour voir le plan jour par jour et comment trouver vos clients.";
}
