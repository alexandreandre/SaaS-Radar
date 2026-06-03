import Link from "next/link";
import type { NewsArticle } from "@/data/newsletter";
import { categoryLabels } from "@/data/newsletter";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

const categoryStyles: Record<NewsArticle["category"], string> = {
  ia: "text-primary",
  "actu-tech": "text-muted-foreground",
  saas: "text-accent-foreground",
};

export function ArticleCard({
  article,
  locked = false,
  compact = false,
}: {
  article: NewsArticle;
  locked?: boolean;
  compact?: boolean;
}) {
  const content = (
    <article
      className={cn(
        "group block border-b border-border last:border-0",
        compact ? "py-2.5" : "py-4",
        locked && "opacity-80"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "font-data text-[10px] font-medium uppercase tracking-data",
            categoryStyles[article.category]
          )}
        >
          {categoryLabels[article.category]}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="font-data text-[10px] uppercase tracking-data text-muted-foreground">
          {article.dateLabel} · {article.readMinutes} min
        </span>
        {locked && (
          <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-label="Contenu réservé" />
        )}
      </div>
      <h3
        className={cn(
          "mt-1.5 font-display font-medium leading-snug tracking-tight group-hover:text-primary",
          compact ? "text-base" : "mt-2 text-lg sm:text-xl"
        )}
      >
        {article.title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed text-muted-foreground line-clamp-2",
          compact ? "mt-1" : "mt-2"
        )}
      >
        {article.excerpt}
      </p>
      {!locked && !compact && (
        <span className="mt-3 inline-block text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Lire l&apos;article →
        </span>
      )}
    </article>
  );

  return (
    <Link
      href={`/newsletter/${article.slug}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
    >
      {content}
    </Link>
  );
}
