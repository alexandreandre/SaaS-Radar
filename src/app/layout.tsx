import type { Metadata } from "next";
import { Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TierProvider } from "@/contexts/tier-context";
import { getCurrentUser, getTier, isAdmin } from "@/lib/auth";
import { SessionProvider } from "@/contexts/session-context";
import { DevChunkRecovery } from "@/components/dev-chunk-recovery";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Le compagnon de build pour fondateurs`,
  description: BRAND_TAGLINE,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, serverTier, serverIsAdmin] = await Promise.all([
    getCurrentUser(),
    getTier(),
    isAdmin(),
  ]);
  const isAuthenticated = !!user;

  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body
        className={`${sourceSans.variable} ${plexMono.variable} font-sans`}
      >
        {process.env.NODE_ENV === "development" ? <DevChunkRecovery /> : null}
        <WebVitalsReporter />
        <ThemeProvider>
          <SessionProvider isAuthenticated={isAuthenticated} isAdmin={serverIsAdmin}>
            <TierProvider serverTier={serverTier} isAuthenticated={isAuthenticated}>
              <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            </TierProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
