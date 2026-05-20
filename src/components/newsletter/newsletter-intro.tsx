import { getTodayFlashBriefs, categoryLabels, newsletterStats, type ArticleCategory } from "@/data/newsletter";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { cn } from "@/lib/utils";

const categoryBorder: Record<ArticleCategory, string> = {
  ia: "border-l-primary",
  "actu-tech": "border-l-foreground/25",
  saas: "border-l-primary/50",
};

const categoryTag: Record<ArticleCategory, string> = {
  ia: "text-primary",
  "actu-tech": "text-muted-foreground",
  saas: "text-foreground/70",
};

export function NewsletterIntro() {
  const items = getTodayFlashBriefs();

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:py-10 lg:items-start">
        <div className="min-w-0">
          <p className="label-data">Le Radar</p>
          <h1 className="mt-2 font-display text-2xl font-medium tracking-tight sm:text-3xl">
            L&apos;actu IA, tech et SaaS — lisible en 2 minutes.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Flash du matin, articles courts. Pas de mur de texte.
          </p>
          <div className="mt-5 max-w-sm">
            <SubscribeForm buttonLabel="Recevoir le flash" />
          </div>
          <p className="mt-3 font-data text-[10px] uppercase tracking-data text-muted-foreground">
            {newsletterStats.subscribers.toLocaleString("fr-FR")} lecteurs · édition du{" "}
            {newsletterStats.editionToday}
          </p>
        </div>

        <div className="min-w-0 lg:border-l lg:border-border lg:pl-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
              Ce matin
            </h2>
            <span className="shrink-0 font-data text-[10px] tabular-nums text-muted-foreground">
              {items.length} infos
            </span>
          </div>

          <ol className="mt-5 space-y-0">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "border-l-2 py-3 pl-4 transition-colors hover:bg-muted/40",
                  categoryBorder[item.category],
                  index === 0 && "border-l-[3px] py-3.5 pl-[15px]",
                  index < items.length - 1 && "border-b border-b-border/60"
                )}
              >
                <p className="leading-snug">
                  <span
                    className={cn(
                      "mr-2 font-data text-[11px] font-medium tabular-nums",
                      categoryTag[item.category]
                    )}
                  >
                    {categoryLabels[item.category]}
                  </span>
                  <span
                    className={cn(
                      "text-[15px] text-foreground",
                      index === 0 && "font-display text-base font-medium sm:text-[17px]"
                    )}
                  >
                    {item.sentence}
                  </span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
