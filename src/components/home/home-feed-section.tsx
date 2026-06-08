"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/types/opportunity";
import { getPresentSectorChips, getSectorFilterKey } from "@/data/sectors";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "@/components/opportunities/countdown-timer";

const OpportunityCard = dynamic(
  () => import("@/components/opportunities/opportunity-card").then((m) => m.OpportunityCard),
  {
    loading: () => (
      <div className="h-48 animate-pulse rounded-lg border border-border bg-muted/40" />
    ),
  }
);

const SectorSearchPicker = dynamic(
  () =>
    import("@/components/opportunities/sector-search-picker").then((m) => m.SectorSearchPicker),
  { ssr: false }
);

const chipClass = (active: boolean) =>
  cn(
    "rounded-sm px-3 py-1.5 font-data text-[10px] font-medium uppercase tracking-data transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
  );

function FeedSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-lg border border-border bg-muted/40" />
      ))}
    </div>
  );
}

export function HomeFeedSection({ opportunities }: { opportunities: Opportunity[] }) {
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const analystFeed = useMemo(() => opportunities.filter((o) => !o.weeklyPick), [opportunities]);
  const feedPreview = useMemo(() => analystFeed.slice(0, 8), [analystFeed]);
  const analystTotal = analystFeed.length;
  const sectorChips = useMemo(
    () => getPresentSectorChips(feedPreview.map((o) => o.sector)),
    [feedPreview]
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filterKey = getSectorFilterKey(sectorFilter);

  const filtered = useMemo(
    () =>
      filterKey === "all" ? feedPreview : feedPreview.filter((o) => o.sector === filterKey),
    [filterKey, feedPreview]
  );

  const topPickId = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((best, o) =>
      o.scores.opportunity > best.scores.opportunity ? o : best
    ).id;
  }, [filtered]);

  const archivedCount = Math.max(0, analystTotal - feedPreview.length);

  return (
    <section ref={sectionRef} className="border-b border-border bg-background py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div>
          <p className="label-data">Flux analyste</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-8">
            <h2 className="font-display text-2xl font-medium tracking-tight">Opportunités cette semaine</h2>
            <CountdownTimer variant="weekEnd" />
          </div>
        </div>

        <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max flex-wrap items-center gap-1.5 sm:min-w-0">
            <button
              type="button"
              onClick={() => setSectorFilter("all")}
              className={chipClass(sectorFilter === "all")}
            >
              Tous · {feedPreview.length}
            </button>
            {sectorChips.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSectorFilter(s.id)}
                className={chipClass(sectorFilter === s.id)}
              >
                {s.label}
              </button>
            ))}
            {visible && (
              <SectorSearchPicker
                value={sectorFilter}
                onChange={setSectorFilter}
                chipClass={chipClass}
              />
            )}
          </div>
        </div>

        {!visible ? (
          <FeedSkeleton />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {filtered.length > 0 ? (
              filtered.map((o, i) => (
                <OpportunityCard
                  key={o.id}
                  opportunity={o}
                  index={i}
                  isTopPick={topPickId === o.id}
                />
              ))
            ) : (
              <p className="col-span-full rounded-lg border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
                Aucune opportunité dans ce secteur pour l&apos;aperçu —{" "}
                <Link href="/opportunities" className="font-medium text-primary hover:underline">
                  voir toutes les fiches
                </Link>
                .
              </p>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <Button size="lg" asChild>
            <Link href="/opportunities">Voir les {analystTotal} opportunités →</Link>
          </Button>
          {archivedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              + {archivedCount} archivées dans la base analyste
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
