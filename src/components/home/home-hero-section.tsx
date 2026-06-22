"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { MAP_EXPLORE_QUERY, MAP_EXPLORE_VALUE } from "@/lib/map-routes";
import type { MapCatalogOpportunity } from "@/context/map-catalog-context";
import { isDiscoveryPhase } from "@/lib/product-phase";
import { cn } from "@/lib/utils";

const HomeMapGateway = dynamic(
  () => import("@/components/world/home-map-gateway").then((m) => ({ default: m.HomeMapGateway })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[16/10] w-full animate-pulse rounded-xl bg-muted/40" aria-hidden />
    ),
  },
);

const IDEA_PLACEHOLDERS = [
  "Un CRM pour coachs sportifs indépendants…",
  "Un outil de devis pour plombiers…",
  "Une app de rappels RDV pour cabinets médicaux…",
];

export type HomeMapStats = {
  countriesTracked: number;
  totalMicroSaas: number;
  hottestMarket: { flag: string; name: string };
};

type HomeHeroProps = {
  mapStats: HomeMapStats;
  mapCatalog: MapCatalogOpportunity[];
};

function HomeHeroBuildCta({ mapUnlocked }: { mapUnlocked: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [idea, setIdea] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [githubLoading, setGithubLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % IDEA_PLACEHOLDERS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const handleAnalyze = useCallback(() => {
    const trimmed = idea.trim();
    if (trimmed.length < 8) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/start?idea=${encodeURIComponent(trimmed)}`);
  }, [idea, router]);

  const handleGitHub = useCallback(async () => {
    setGithubLoading(true);
    try {
      const res = await fetch("/api/onboarding/github", { method: "POST" });
      if (res.status === 401) {
        router.push("/login?next=/start%3Fgithub%3D1");
        return;
      }
      const data = (await res.json()) as {
        projectId?: string;
        error?: string;
      };
      if (!res.ok || !data.projectId) {
        throw new Error(data.error ?? "Impossible de créer le projet");
      }
      window.location.href = `/api/connectors/github/oauth?projectId=${encodeURIComponent(data.projectId)}&module=build`;
    } catch {
      router.push("/login?next=/start%3Fgithub%3D1");
    } finally {
      setGithubLoading(false);
    }
  }, [router]);

  return (
    <div
      className={cn(
        "pointer-events-auto absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center transition-transform duration-500 ease-out sm:bottom-2 sm:px-6",
        mapUnlocked && "scale-[0.98]",
      )}
    >
      <p className="mb-4 font-display text-xl font-medium tracking-tight sm:text-2xl">
        Déjà votre idée ? Décrivez ce que vous voulez construire
      </p>

      <div
        className={cn(
          "flex items-center gap-2 rounded-[1.75rem] border border-white/30 bg-card/98 p-2 pl-4 shadow-2xl shadow-black/45 backdrop-blur-xl sm:pl-5",
          "ring-1 ring-inset ring-white/15 transition-[border-color,box-shadow,background-color] focus-within:border-primary/50 focus-within:bg-card focus-within:shadow-2xl focus-within:shadow-primary/20",
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAnalyze();
          }}
          placeholder={IDEA_PLACEHOLDERS[placeholderIndex]}
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base text-foreground placeholder:text-muted-foreground/80 focus:outline-none sm:text-lg"
          aria-label="Décrire votre idée SaaS"
        />

        <button
          type="button"
          onClick={handleAnalyze}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:px-5"
        >
          Commencer
        </button>
      </div>

      <button
        type="button"
        onClick={handleGitHub}
        disabled={githubLoading}
        className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        {githubLoading ? "Connexion…" : "Déjà un repo · Connecter GitHub"}
      </button>
    </div>
  );
}

function HomeHeroInner({ mapStats, mapCatalog }: HomeHeroProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const discovery = isDiscoveryPhase();
  const [mapUnlocked, setMapUnlocked] = useState(false);
  const exploreParam = searchParams.get(MAP_EXPLORE_QUERY);

  useEffect(() => {
    if (exploreParam !== MAP_EXPLORE_VALUE) return;
    setMapUnlocked(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [exploreParam]);

  const handleMapUnlock = useCallback(() => {
    setMapUnlocked(true);
  }, []);

  const handleMapLock = useCallback(() => {
    setMapUnlocked(false);
    if (exploreParam === MAP_EXPLORE_VALUE) {
      router.replace("/", { scroll: false });
    }
  }, [exploreParam, router]);

  return (
    <section
      id="home-hero"
      className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-background text-foreground"
    >
      <div className="absolute inset-0 z-0 road-grid opacity-30" />
      <div className="absolute inset-0 z-0">
        <HomeMapGateway
          unlocked={mapUnlocked}
          showDashboard={exploreParam === MAP_EXPLORE_VALUE}
          onUnlock={handleMapUnlock}
          onLock={handleMapLock}
          deferMap={exploreParam !== MAP_EXPLORE_VALUE && !mapUnlocked}
          mapCatalog={mapCatalog}
        />
      </div>

      <div className="pointer-events-none relative z-[60] min-h-[min(100dvh,920px)]">
        <Navbar overlay />

        <div
          className={cn(
            "flex min-h-[min(100dvh,920px)] flex-col items-center px-4 pt-4 text-center transition-all duration-500 ease-out sm:px-6",
            discovery
              ? "justify-end pb-[40vh] sm:pb-[38vh]"
              : "justify-center pb-48 sm:pb-52",
            mapUnlocked && "pointer-events-none opacity-0 -translate-y-6",
          )}
        >
          <div className="max-w-xl">
            <h1 className="text-balance font-display text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Où naissent les SaaS{" "}
              <span className="text-muted-foreground">que vous pouvez importer.</span>
            </h1>

            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 font-data text-xs uppercase tracking-data text-muted-foreground">
              <span>
                <strong className="text-foreground tabular-nums">{mapStats.countriesTracked}</strong>{" "}
                pays indexés
              </span>
              <span>
                <strong className="text-foreground tabular-nums">
                  {mapStats.totalMicroSaas.toLocaleString("fr-FR")}
                </strong>{" "}
                SaaS trackés
              </span>
            </div>
            <p className="mt-4 font-data text-sm uppercase tracking-data text-foreground/90">
              Clique sur la carte
            </p>
          </div>
        </div>

        {discovery ? (
          mapUnlocked ? (
            <div
              className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center transition-transform duration-500 ease-out sm:bottom-2 sm:px-6 scale-[0.98]"
            >
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-opacity hover:opacity-90"
              >
                Parcourir les opportunités
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : null
        ) : (
          <HomeHeroBuildCta mapUnlocked={mapUnlocked} />
        )}
      </div>
    </section>
  );
}

function HomeHeroFallback({ mapStats }: { mapStats: HomeMapStats }) {
  const discovery = isDiscoveryPhase();

  return (
    <section
      id="home-hero"
      className="relative min-h-[min(100dvh,920px)] overflow-hidden bg-background text-foreground"
    >
      <div className="absolute inset-0 z-0 road-grid opacity-30" />
      <div className="pointer-events-none relative z-[60] min-h-[min(100dvh,920px)]">
        <Navbar overlay />
        <div
          className={cn(
            "flex min-h-[min(100dvh,920px)] flex-col items-center px-4 pt-4 text-center sm:px-6",
            discovery
              ? "justify-end pb-[40vh] sm:pb-[38vh]"
              : "justify-center pb-48 sm:pb-52",
          )}
        >
          <div className="max-w-xl">
            <div className="h-10 animate-pulse rounded-lg bg-muted sm:h-12" />
            <p className="mt-8 font-data text-xs uppercase tracking-data text-muted-foreground">
              {mapStats.countriesTracked} pays indexés
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:bottom-2 sm:px-6">
          <div className="h-12 animate-pulse rounded-[1.75rem] bg-muted" />
        </div>
      </div>
    </section>
  );
}

export function HomeHeroSection({ mapStats, mapCatalog }: HomeHeroProps) {
  return (
    <Suspense fallback={<HomeHeroFallback mapStats={mapStats} />}>
      <HomeHeroInner mapStats={mapStats} mapCatalog={mapCatalog} />
    </Suspense>
  );
}
