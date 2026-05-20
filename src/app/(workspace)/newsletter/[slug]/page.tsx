import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ArticleReader } from "@/components/newsletter/article-reader";
import { getArticleBySlug, newsArticles } from "@/data/newsletter";

export function generateStaticParams() {
  return newsArticles.map((a) => ({ slug: a.slug }));
}

export default function NewsletterArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  return (
    <>
      <Navbar />
      <ArticleReader article={article} />
      <Footer />
    </>
  );
}
