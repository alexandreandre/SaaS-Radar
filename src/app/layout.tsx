import type { Metadata } from "next";
import { Newsreader, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TierProvider } from "@/contexts/tier-context";
import { PortfolioProvider } from "@/contexts/portfolio-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { getAllOpportunities } from "@/lib/opportunities";
import { getCurrentUser, getTier, isAdmin } from "@/lib/auth";
import { SessionProvider } from "@/contexts/session-context";
import { DevChunkRecovery } from "@/components/dev-chunk-recovery";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  weight: ["400", "500", "600"],
  adjustFontFallback: false,
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SaaS Radar — Intelligence SaaS pour la France",
  description:
    "Opportunités SaaS validées à l'étranger, scores France Fit et Buildability, carte mondiale et outil d'analyste pour entrepreneurs français.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Catalogue brut : l'enrichissement premium est désormais fait à la volée par
  // PortfolioProvider.getCatalogOpportunity (lookup ponctuel) plutôt que sur tout le
  // catalogue à chaque requête racine — allège le rendu de toutes les pages.
  const opportunityCatalog = await getAllOpportunities();

  // Tier autoritatif cote serveur (profiles.plan) : injecte dans TierProvider pour
  // qu'aucun compte authentifie ne puisse se sur-classer via localStorage.
  const [user, serverTier, serverIsAdmin] = await Promise.all([
    getCurrentUser(),
    getTier(),
    isAdmin(),
  ]);
  const isAuthenticated = !!user;

  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${sourceSans.variable} ${newsreader.variable} ${plexMono.variable} font-sans`}
      >
        {process.env.NODE_ENV === "development" ? <DevChunkRecovery /> : null}
        <ThemeProvider>
          <SessionProvider isAuthenticated={isAuthenticated} isAdmin={serverIsAdmin}>
            <TierProvider serverTier={serverTier} isAuthenticated={isAuthenticated}>
              <PortfolioProvider opportunityCatalog={opportunityCatalog} userId={user?.id ?? null}>
                <FavoritesProvider>
                  <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
                </FavoritesProvider>
              </PortfolioProvider>
            </TierProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
