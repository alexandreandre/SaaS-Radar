import { FavoritesProvider } from "@/contexts/favorites-context";

/** Pages publiques : favoris légers uniquement (pas de portfolio cockpit). */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}
