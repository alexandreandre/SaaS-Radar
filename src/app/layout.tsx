import type { Metadata } from "next";
import { Newsreader, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TierProvider } from "@/contexts/tier-context";
import { PortfolioProvider } from "@/contexts/portfolio-context";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${sourceSans.variable} ${newsreader.variable} ${plexMono.variable} font-sans`}
      >
        <ThemeProvider>
          <TierProvider>
            <PortfolioProvider>
              <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
            </PortfolioProvider>
          </TierProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
