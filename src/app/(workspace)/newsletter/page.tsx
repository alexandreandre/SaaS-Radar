import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { NewsletterIntro } from "@/components/newsletter/newsletter-intro";
import { NewsletterMain } from "@/components/newsletter/newsletter-main";
import { ArticlesFeed } from "@/components/newsletter/articles-feed";
import { StickySubscribeBar } from "@/components/newsletter/sticky-subscribe-bar";

export default function NewsletterPage() {
  return (
    <>
      <Navbar />
      <NewsletterIntro />
      <NewsletterMain />
      <ArticlesFeed />
      <Footer />
      <StickySubscribeBar />
    </>
  );
}
