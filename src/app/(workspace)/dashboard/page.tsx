import { getCurrentUser, getTier } from "@/lib/auth";
import { tierLabels } from "@/lib/tier";
import { DashboardClient } from "./dashboard-client";

// Specifique a l'utilisateur (session) -> rendu dynamique.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [user, tier] = await Promise.all([getCurrentUser(), getTier()]);
  // Le layout (workspace) garantit deja une session ; fallback defensif.
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";

  return (
    <DashboardClient
      displayName={displayName}
      planLabel={tierLabels[tier]}
    />
  );
}
