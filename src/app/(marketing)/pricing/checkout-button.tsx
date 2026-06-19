"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingInterval, PaidPlan } from "@/lib/billing/plans";

export function CheckoutButton({
  plan,
  interval,
  className,
  children,
}: {
  plan: PaidPlan;
  interval: BillingInterval;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setLoading(false);
      alert(data.error ?? "Impossible de démarrer le paiement.");
    } catch {
      setLoading(false);
      alert("Impossible de démarrer le paiement.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
      aria-busy={loading}
    >
      {loading ? "Redirection…" : children}
    </button>
  );
}
