"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types/opportunity";
import { SectionTitle } from "@/components/opportunities/detail/section-title";
import { AnimatedSection } from "@/components/opportunities/detail/animated-section";

interface AcquisitionSectionProps {
  opportunity: Opportunity;
  animationIndex: number;
}

const TOOL_META: Record<
  string,
  { logoUrl: string; url: string; color: string; toolName: string }
> = {
  "Cold Email": {
    logoUrl: "https://www.google.com/gmail/about/static-2.0/images/logo-gmail.png",
    url: "https://hunter.io",
    color: "text-red-400",
    toolName: "Hunter.io",
  },
  "Cold email": {
    logoUrl: "https://cdn.worldvectorlogo.com/logos/gmail-icon.svg",
    url: "https://hunter.io",
    color: "text-red-400",
    toolName: "Hunter.io",
  },
  LinkedIn: {
    logoUrl: "https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg",
    url: "https://linkedin.com",
    color: "text-blue-500",
    toolName: "LinkedIn",
  },
  SEO: {
    logoUrl: "https://cdn.worldvectorlogo.com/logos/google-search-console.svg",
    url: "https://search.google.com/search-console",
    color: "text-orange-400",
    toolName: "Google Search Console",
  },
  Referral: {
    logoUrl: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg",
    url: "https://partnerstack.com",
    color: "text-green-400",
    toolName: "PartnerStack",
  },
  "Partenariats locaux": {
    logoUrl: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg",
    url: "#",
    color: "text-green-400",
    toolName: "Réseau local",
  },
};

const DEFAULT_TOOL_META = {
  logoUrl: "",
  url: "https://google.com",
  color: "text-muted-foreground",
  toolName: "Outil recommandé",
};

const CAC_CHANNEL_MAP: Record<string, string> = {
  "Cold Email": "Cold email",
  "Partenariats locaux": "Referral",
};

function getFaviconDomain(url: string): string {
  if (!url || url === "#") return "partnerstack.com";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "google.com";
  }
}

function getCacEstimate(opportunity: Opportunity, tabTitle: string): number | undefined {
  const channelKey = CAC_CHANNEL_MAP[tabTitle] ?? tabTitle;
  return opportunity.cacChannels.find(
    (c) => c.channel.toLowerCase() === channelKey.toLowerCase(),
  )?.estimate;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-400" />
          <span className="text-green-400">Copié !</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copier
        </>
      )}
    </button>
  );
}

export function AcquisitionSection({ opportunity, animationIndex }: AcquisitionSectionProps) {
  const [activeGenerator, setActiveGenerator] = useState<string | null>(null);
  const [generatorType, setGeneratorType] = useState<"prompt" | "email" | "message">("prompt");

  const generateContent = (channel: string, type: "prompt" | "email" | "message"): string => {
    const productName = opportunity.name;
    const target = opportunity.targetClient;
    const price =
      opportunity.financialScenarios.find((s) => s.name === "Réaliste")?.avgPrice ?? 79;
    const pain =
      opportunity.foreignMarketProfile?.problemSolved ??
      `les ${target} perdent du temps et de l'argent`;
    const tactics = opportunity.acquisition.find((a) => a.title === channel)?.tactics ?? [];

    if (channel === "Cold email" || channel === "Cold Email") {
      if (type === "prompt") {
        return `Tu es un expert en cold email B2B pour les SaaS français.

Produit : "${productName}"
Cible : ${target}
Problème résolu : ${pain}
Prix : ${price}€/mois

Génère une séquence complète de 4 emails cold :
- Email 1 : Accroche problème (max 5 lignes)
- Email 2 (J+3) : Preuve sociale US (Arini fait 42k$/mois, personne en France)
- Email 3 (J+7) : Demo rapide 15 min
- Email 4 (J+14) : Break-up email

Tactiques à intégrer :
${tactics.map((t) => `- ${t}`).join("\n")}`;
      }

      if (type === "email") {
        return `Objet : [${target}] — vous perdez des RDV sans le savoir

Bonjour [Dr. Nom],

Une stat qui m'a frappé : les cabinets dentaires perdent en moyenne 15-20% de leurs appels entrants.

Avec 2 praticiens, ça représente entre 18 000€ et 48 000€ de CA non capturé chaque année.

J'ai construit ${productName} pour résoudre exactement ça — une IA qui répond à vos appels 24/7, qualifie les patients et prend les RDV directement dans votre agenda.

Est-ce que vous avez 15 minutes cette semaine pour voir comment ça fonctionne ?

[Votre prénom]
Fondateur — ${productName} | ${price}€/mois`;
      }

      return `Bonjour Dr. [Nom] 👋

Je vois que vous avez un cabinet à [Ville] — je travaille sur un outil qui aide les dentistes à ne plus manquer d'appels patients.

En ce moment, 68% des cabinets indépendants n'ont pas de standard dédié. Mon IA répond à votre place 24/7.

Dispo pour 10 min cette semaine ?`;
    }

    if (channel === "LinkedIn") {
      if (type === "prompt") {
        return `Tu es un expert en personal branding LinkedIn pour les fondateurs de SaaS B2B français.

Je lance "${productName}" pour ${target}.
Problème : ${pain}

Génère :
1. Un post LinkedIn viral (format storytelling, 150-200 mots) sur la douleur du marché
2. Un message de connexion (< 300 caractères) pour approcher des ${target}
3. Un DM de suivi après acceptation de la connexion
4. Une bio LinkedIn optimisée pour attirer des ${target}

Ton : direct, expert, pas de jargon startup`;
      }

      if (type === "email") {
        return `Objet : Suite à votre post LinkedIn

Bonjour [Prénom],

J'ai vu votre post sur [sujet lié à leur métier] — ça m'a parlé directement.

Je construis ${productName}, un outil pour ${target} qui résout exactement [problème mentionné dans leur post].

Je serais curieux d'avoir votre retour d'expert en 15 minutes — pas de pitch, juste votre avis.

Dispo cette semaine ?

[Votre prénom]`;
      }

      return `Bonjour [Prénom],

Merci pour la connexion !

Je développe ${productName} pour ${target} — une solution qui [bénéfice clé en 1 ligne].

On a déjà [X] cabinets en beta. Votre avis m'intéresserait si vous avez 10 min cette semaine ?

Pas de pitch, promis 🙂`;
    }

    if (channel === "SEO") {
      if (type === "prompt") {
        return `Tu es un expert SEO pour les SaaS B2B français.

Site : ${productName} (${target})
Problème résolu : ${pain}

Génère :
1. 15 mots-clés prioritaires avec intention de recherche (transactional/informational)
2. Structure d'une page pilier optimisée SEO
3. 5 idées d'articles de blog avec titres et méta-descriptions
4. Stratégie de netlinking pour le secteur ${opportunity.sector}
5. Les featured snippets à cibler en priorité`;
      }

      if (type === "email") {
        return `Objet : Partenariat contenu — ${productName} x [Leur site]

Bonjour [Prénom],

Je viens de lire votre article sur [sujet lié] — excellente analyse.

Je lance ${productName}, un SaaS pour ${target}. On cible les mêmes lecteurs.

Je vous propose un échange de liens ou un article invité sur [sujet complémentaire].

Intéressé ?

[Votre prénom]`;
      }

      return `Bonjour [Prénom],

J'ai vu que vous êtes actif dans l'écosystème [secteur].

Je lance ${productName} et je cherche des partenaires contenu pour des articles croisés.

On touche les mêmes ${target} — ça vous dirait qu'on en parle ?`;
    }

    if (type === "prompt") {
      return `Tu es un expert en programme de referral B2B.

Produit : "${productName}" pour ${target} à ${price}€/mois
Problème : ${pain}

Génère :
1. Structure d'un programme de partenariat (commission, conditions)
2. Script pour approcher un premier partenaire référent
3. Email de présentation du programme
4. Mécanisme d'incentive pour les référents
5. Comment tracker les referrals sans outil complexe`;
    }

    if (type === "email") {
      return `Objet : Programme partenaire — ${productName}

Bonjour [Prénom],

Je lance ${productName} pour ${target} et je cherche des partenaires référents.

Le deal : vous recommandez notre solution à vos clients/contacts, on vous verse [X]% de commission récurrente.

Vos clients y gagnent, vous aussi.

Intéressé pour en discuter ?

[Votre prénom]`;
    }

    return `Bonjour [Prénom] 👋

Je développe ${productName} pour ${target}.

Je cherche des partenaires dans [secteur] pour un programme de referral — commission récurrente sur chaque client apporté.

Ça vous parlerait ?`;
  };

  return (
    <AnimatedSection
      id="acquisition"
      animationIndex={animationIndex}
      className="mb-12 scroll-mt-24"
    >
      <SectionTitle number={7} title="Trouver tes clients" />
      <p className="mb-6 text-sm text-muted-foreground">
        Les canaux qui convertissent — tactiques concrètes et outils cliquables
      </p>

      <div className="mb-6 space-y-3">
        {opportunity.acquisition.map((tab, i) => {
          const meta = TOOL_META[tab.title] ?? DEFAULT_TOOL_META;
          const isOpen = activeGenerator === tab.title;
          const cacEstimate = getCacEstimate(opportunity, tab.title);
          const generatedContent = generateContent(tab.title, generatorType);
          const faviconDomain = getFaviconDomain(meta.url);

          return (
            <div
              key={tab.id ?? i}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isOpen ? "border-border bg-card" : "border-border bg-muted/20",
              )}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${faviconDomain}&sz=32`}
                    alt={tab.title}
                    className="h-5 w-5"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{tab.title}</p>
                    {meta.url !== "#" && (
                      <a
                        href={meta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-1 text-xs hover:underline",
                          meta.color,
                        )}
                      >
                        {meta.toolName} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {meta.url === "#" && (
                      <span className={cn("text-xs", meta.color)}>{meta.toolName}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">CAC : ~{cacEstimate ?? "?"}€</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGenerator(isOpen ? null : tab.title)}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20 hover:text-purple-300"
                >
                  <Wand2 className="h-3 w-3" />
                  Générer
                </button>
              </div>

              <div className="px-4 pb-4 pl-14">
                <ul className="space-y-1">
                  {tab.tactics.map((tactic, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1 shrink-0 text-muted-foreground/60">→</span>
                      {tactic}
                    </li>
                  ))}
                </ul>
              </div>

              {isOpen && (
                <div className="border-t border-border p-4">
                  <div className="mb-4 flex gap-2">
                    {(
                      [
                        { id: "prompt", label: "🤖 Prompt Claude" },
                        { id: "email", label: "📧 Cold email" },
                        { id: "message", label: "💬 Message LinkedIn" },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setGeneratorType(t.id)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs transition-colors",
                          generatorType === t.id
                            ? "bg-purple-600 text-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="rounded-xl border border-gray-700 bg-gray-950 p-4 dark:border-gray-700 dark:bg-gray-950">
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-300">
                        {generatedContent}
                      </pre>
                    </div>
                    <div className="absolute right-3 top-3">
                      <CopyBtn text={generatedContent} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
