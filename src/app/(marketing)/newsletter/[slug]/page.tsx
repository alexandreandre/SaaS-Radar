import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArticleReader } from "@/components/newsletter/article-reader";
import { getArticleBySlug, newsArticles, resolveArticleOpportunitySlug } from "@/data/newsletter";
import { getAllOpportunities } from "@/lib/opportunities";

export function generateStaticParams() {
  return newsArticles.map((a) => ({ slug: a.slug }));
}

export default async function NewsletterArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const catalog = await getAllOpportunities();
  const linkedOpportunitySlug = article.opportunitySlug
    ? resolveArticleOpportunitySlug(article, catalog)
    : null;

  return (
    <>
      <Navbar />
      <ArticleReader article={article} linkedOpportunitySlug={linkedOpportunitySlug} />
      <Footer />
    </>
  );
}
