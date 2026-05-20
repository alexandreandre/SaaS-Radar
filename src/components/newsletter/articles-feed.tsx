"use client";

import { useState } from "react";
import {
  getArticlesByCategory,
  categoryLabels,
  type ArticleCategory,
} from "@/data/newsletter";
import { ArticleCard } from "@/components/newsletter/article-card";
import { useTier } from "@/contexts/tier-context";
import { hasTier } from "@/lib/tier";
import { cn } from "@/lib/utils";

const tabs: { id: ArticleCategory | "all"; label: string }[] = [
  { id: "all", label: "Tout" },
  { id: "ia", label: categoryLabels.ia },
  { id: "actu-tech", label: categoryLabels["actu-tech"] },
  { id: "saas", label: categoryLabels.saas },
];

const chipClass = (active: boolean) =>
  cn(
    "rounded-sm px-3 py-1.5 font-data text-[10px] font-medium uppercase tracking-data transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
  );

export function ArticlesFeed() {
  const [tab, setTab] = useState<ArticleCategory | "all">("all");
  const { tier } = useTier();
  const articles = getArticlesByCategory(tab).filter((a) => !a.featured);

  return (
    <section
      id="articles-suite"
      className="scroll-mt-20 bg-muted/20 py-8 sm:py-10"
      aria-labelledby="articles-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:max-w-3xl lg:mx-auto">
        <h2 id="articles-heading" className="font-display text-xl font-medium tracking-tight">
          Articles
        </h2>

        <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Rubriques">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={chipClass(tab === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-2" role="tabpanel">
          {articles.length > 0 ? (
            articles.map((article) => {
              const locked =
                article.tier === "pro"
                  ? !hasTier(tier, "pro")
                  : article.tier === "builder"
                    ? !hasTier(tier, "builder")
                    : false;
              return <ArticleCard key={article.id} article={article} locked={locked} />;
            })
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun article dans cette rubrique.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
