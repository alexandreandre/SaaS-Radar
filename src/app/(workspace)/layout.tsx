import { PortfolioProvider } from "@/contexts/portfolio-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { getOpportunityListItems } from "@/lib/opportunities";
import { getCurrentUser } from "@/lib/auth";

/** Workspace : cockpit, mes-saas, opportunités, compte — providers métier. */
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [catalogIndex, user] = await Promise.all([
    getOpportunityListItems(),
    getCurrentUser(),
  ]);

  return (
    <PortfolioProvider catalogIndex={catalogIndex} userId={user?.id ?? null}>
      <FavoritesProvider>{children}</FavoritesProvider>
    </PortfolioProvider>
  );
}
