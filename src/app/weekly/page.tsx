import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getDealOfTheWeek } from "@/data/opportunities";
import { Button } from "@/components/ui/button";
import { DealOfWeekCard } from "@/components/opportunities/deal-of-week";

export default function WeeklyPage() {
  const pick = getDealOfTheWeek();

  return (
    <>
      <Navbar />
      <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-accent">Édition du 19 mai 2025</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight leading-tight">
          Pourquoi c&apos;est L&apos;opportunité de la semaine
        </h1>
        <p className="mt-4 text-xl text-muted-foreground leading-relaxed">
          Réceptionniste IA pour cabinets dentaires — le marché US a parlé. La France attend.
        </p>

        <blockquote className="my-12 border-l-4 border-accent pl-6 text-2xl font-medium leading-snug text-zinc-800">
          « Chaque appel manqué, c&apos;est 150 à 400 euros qui s&apos;envolent. En France, personne n&apos;a encore gagné ce marché. »
        </blockquote>

        <div className="prose prose-zinc max-w-none space-y-6 text-base leading-relaxed text-zinc-700">
          <p>
            Je passe mes semaines à scanner Product Hunt, Indie Hackers et les filings US. Cette semaine, un pattern m&apos;est revenu trois fois : les SaaS de réception téléphonique IA pour cabinets dentaires explosent outre-Atlantique. Arini fait 42k$ MRR. D&apos;autres suivent. Et en France ? Silence radio.
          </p>
          <p>
            Ce n&apos;est pas un problème de technologie — c&apos;est un problème de distribution et de confiance. Les dentistes français ne cherchent pas une « IA cool ». Ils cherchent quelqu&apos;un qui répond quand leur assistante est en consultation. Votre angle : <strong>« On récupère vos RDV manqués »</strong>, pas « On utilise GPT-4 ».
          </p>
          <p>
            Le marché est sous-servi pour une raison simple : les acteurs français vendent encore des packs d&apos;appels humains à 800€/mois. Un SaaS à 149€/mois avec un numéro dédié et une intégration Doctolib change la donne. Vos clients équivalents : 28 000 cabinets privés, dont la majorité n&apos;a pas de standard dédié.
          </p>
          <p>
            Mon conseil d&apos;angle : ciblez les cabinets 1-3 praticiens en province d&apos;abord. Moins de cycles de vente, plus de douleur téléphonique (moins de staff). Évitez Paris au début — trop de bruit, trop de « on a déjà une solution ».
          </p>
          <p>
            <strong>Erreur n°1 à éviter :</strong> stocker des données médicales patients dès le V1. Vous n&apos;avez pas besoin du dossier médical pour prendre un RDV. Restez sur métadonnées + sync calendrier. La certification HDS peut attendre le Série A, pas le jour 1.
          </p>
        </div>

        <div className="mt-12">
          <DealOfWeekCard opportunity={pick} />
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" asChild>
            <Link href={`/opportunities/${pick.slug}`}>Voir l&apos;analyse complète →</Link>
          </Button>
        </div>
      </article>
      <Footer />
    </>
  );
}
