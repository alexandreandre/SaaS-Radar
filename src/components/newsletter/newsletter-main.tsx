import Link from "next/link";
import {
  getFeaturedArticle,
  getArticlesByCategory,
  categoryLabels,
  type NewsArticle,
} from "@/data/newsletter";
import { ArticleCard } from "@/components/newsletter/article-card";

export function NewsletterMain() {
  const featured = getFeaturedArticle();
  const previewArticles = getArticlesByCategory("all")
    .filter((a) => !a.featured)
    .slice(0, 4);

  return (
    <section className="border-b border-border bg-background py-6 sm:py-8">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-5">
          <p className="label-data">À la une</p>
          <FeaturedBlock article={featured} />
        </div>

        <div className="min-w-0 lg:col-span-7">
          <h2 className="font-display text-lg font-medium tracking-tight">Articles</h2>
          <div className="mt-3">
            {previewArticles.map((article) => (
              <ArticleCard key={article.id} article={article} compact />
            ))}
          </div>
          <p className="mt-3">
            <a
              href="#articles-suite"
              className="text-sm font-medium text-primary hover:underline"
            >
              Voir tous les articles ↓
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturedBlock({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/newsletter/${article.slug}`}
      className="group mt-3 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
    >
      <span className="font-data text-[10px] font-medium uppercase tracking-data text-primary">
        {categoryLabels[article.category]}
      </span>
      <h3 className="mt-2 font-display text-xl font-medium leading-snug tracking-tight group-hover:text-primary sm:text-2xl">
        {article.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
        {article.excerpt}
      </p>
      <p className="mt-3 text-sm font-medium text-primary">
        Lire · {article.readMinutes} min
      </p>
    </Link>
  );
}
