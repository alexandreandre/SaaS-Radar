import type {
  CompetitionAlert,
  EmailTemplate,
  ForeignMarketProfile,
  FrenchCompetitor,
  InfraCost,
  LaunchWeek,
  Opportunity,
  PartnerLead,
  RoiInput,
  TamBreakdown,
} from "@/types/opportunity";
import { getWhyItWorksFact } from "@/types/opportunity";

export function defaultForeignMarketProfile(opportunity: Opportunity): ForeignMarketProfile {
  const inspiration = opportunity.foreignInspiration;
  const productName = inspiration.split("—")[0]?.split("(")[0]?.trim() || inspiration;
  return {
    productName,
    country: opportunity.originCountry,
    flag: opportunity.originFlag,
    tagline: opportunity.pitch,
    problemSolved: opportunity.whyItWorks[0]
      ? getWhyItWorksFact(opportunity.whyItWorks[0])
      : opportunity.pitch,
    targetUsers: opportunity.targetClient,
    businessModel: "Abonnement SaaS B2B, facturation mensuelle par établissement ou utilisateur.",
    pricing:
      opportunity.tractionSignals.find((s) => /MRR|pricing|prix/i.test(s.label))?.value ??
      "Tarif mensuel éprouvé sur le marché d'origine (voir signaux ci-dessous)",
    keyFeatures: opportunity.mvpPlan.features,
    howItWorks:
      `Le produit cible ${opportunity.targetClient.toLowerCase()} : prise en charge du workflow critique, tableaux de bord simples, intégrations natives au marché local. Le positionnement reste vertical et « une douleur = une feature star ».`,
    whyItWorksThere: opportunity.whyItWorks.map(getWhyItWorksFact),
    tractionHighlights: opportunity.tractionSignals,
  };
}

export function defaultInfraCosts(voice = false): InfraCost[] {
  const base: InfraCost[] = [
    { item: "Hébergement Vercel + Supabase", estimate: 45, note: "Pro plan au lancement", alternative: "Railway + Postgres ~35€" },
    { item: "Stripe (frais)", estimate: 25, note: "~2,9% + 0,25€/transaction", alternative: "Lemon Squeezy si B2C" },
    { item: "Emails transactionnels (Resend)", estimate: 15, note: "<10k emails/mois", alternative: "Postmark" },
    { item: "Domaine + DNS", estimate: 5, note: "Annuel amorti", alternative: "—" },
  ];
  if (voice) {
    base.push(
      { item: "Téléphonie + IA vocale (Twilio/Vapi)", estimate: 120, note: "~0,08€/min + numéro FR", alternative: "Bland.ai si US-first" },
      { item: "Transcription / LLM", estimate: 40, note: "OpenAI API usage-based", alternative: "Groq pour coûts réduits" }
    );
  } else {
    base.push(
      { item: "SMS (Twilio)", estimate: 35, note: "~0,06€/SMS FR", alternative: "OVH SMS si volume" },
      { item: "API IA (optionnel)", estimate: 25, note: "GPT-4o mini pour features smart", alternative: "—" }
    );
  }
  return base;
}

export function defaultLaunchTimeline(niche: string): LaunchWeek[] {
  return [
    {
      week: 1,
      goal: "Valider le problème",
      actions: [
        `10 entretiens ${niche} (30 min)`,
        "Landing page + waitlist",
        "Premier post LinkedIn niche",
      ],
      kpi: "5 réponses « j'ai ce problème »",
    },
    {
      week: 2,
      goal: "MVP fonctionnel",
      actions: ["Core workflow live", "Stripe checkout test", "3 beta users gratuits"],
      kpi: "1 utilisateur actif quotidien",
    },
    {
      week: 3,
      goal: "Premiers prospects payants",
      actions: ["20 cold emails/jour", "Démo 15 min x5", "Itération onboarding"],
      kpi: "2 démos bookées",
    },
    {
      week: 4,
      goal: "Premier revenu",
      actions: ["Relances break-up", "Case study beta", "Pricing validé"],
      kpi: "1 client payant ou LOI signée",
    },
  ];
}

export function defaultEmailTemplates(niche: string): EmailTemplate[] {
  return [
    {
      name: "Problème (J0)",
      subject: `Question rapide — ${niche}`,
      body: `Bonjour {{prenom}},\n\nJe vois que beaucoup de ${niche} en France perdent du temps/chiffre d'affaires sur [problème précis].\n\nEst-ce que c'est aussi votre cas ?\n\n— {{signature}}`,
    },
    {
      name: "Preuve sociale (J+3)",
      subject: "Comment [concurrent US] résout ce problème",
      body: `Bonjour {{prenom}},\n\nUn acteur aux US fait {{mrr}} MRR sur exactement ce use case.\n\nJe teste l'adaptation France — 15 min pour vous montrer ?\n\n— {{signature}}`,
    },
    {
      name: "Break-up (J+10)",
      subject: "Je ferme le dossier ?",
      body: `Bonjour {{prenom}},\n\nSans réponse, j'imagine que ce n'est pas prioritaire. Je vous laisse tranquille.\n\nSi ça change : [lien calendrier].\n\n— {{signature}}`,
    },
  ];
}

export function defaultPartnersFR(sector: string): PartnerLead[] {
  const map: Record<string, PartnerLead[]> = {
    healthcare: [
      { name: "Ordre / syndicats métier", type: "Association", angle: "Webinaire co-brandé « digitalisation cabinet »" },
      { name: "Experts-comptables secteur santé", type: "Prescripteur", angle: "Offre white-label ou commission 15%" },
      { name: "Doctolib (intégration)", type: "Tech", angle: "App marketplace / webhook RDV" },
    ],
    construction: [
      { name: "CAPEB régionale", type: "Association", angle: "Newsletter artisans + stand salon" },
      { name: "Fournisseurs matériaux locaux", type: "Distribution", angle: "Flyer en point de vente + code promo" },
      { name: "Assureurs décennale", type: "Prescripteur", angle: "Pack « devis conforme » co-marketing" },
    ],
    default: [
      { name: "Expert-comptable local", type: "Prescripteur", angle: "Recommandation clients PME" },
      { name: "Consultant métier freelance", type: "Partenaire", angle: "Revente + setup 500€" },
      { name: "Chambre de commerce", type: "Institution", angle: "Atelier lancement gratuit" },
    ],
  };
  return map[sector] ?? map.default;
}

export function defaultFrenchCompetitors(niche: string): FrenchCompetitor[] {
  return [
    { name: "Solution Excel / papier", positioning: "Gratuit, familier", pricing: "0€", strength: "Aucune courbe d'apprentissage", weakness: "Pas scalable, erreurs, pas de rappels auto" },
    { name: "Acteur généraliste FR", positioning: "ERP / suite large", pricing: "80–200€/mois", strength: "Marque connue", weakness: "UX lourde, sur-dimensionné PME" },
    { name: "Startup FR early-stage", positioning: "Vertical partiel", pricing: "29–79€/mois", strength: "UX moderne", weakness: "Fonctionnalités incomplètes, support faible" },
    { name: "Agence / prestataire", positioning: "Service humain", pricing: "500–2000€/mois", strength: "Clé en main", weakness: "Marge faible, pas de produit scalable" },
    { name: "Import US adapté", positioning: "Clone traduit", pricing: "49–149€/mois", strength: "Feature-rich", weakness: "Support FR faible, conformité locale douteuse" },
  ].map((c, i) => (i === 1 ? { ...c, name: `Concurrent vertical ${niche}` } : c));
}

export function defaultTamBreakdown(sector: string): TamBreakdown {
  const tams: Record<string, TamBreakdown> = {
    healthcare: {
      tam: "~2,1 Md€ (logiciels santé ambulatoire FR)",
      sam: "~180 M€ (cabinets 1–10 praticiens)",
      som: "~4,5 M€ (500 clients × 750€ ARPA)",
      note: "Croissance portée par pénurie de personnel administratif.",
    },
    construction: {
      tam: "~890 M€ (logiciels artisans BTP)",
      sam: "~120 M€ (artisans <10 salariés)",
      som: "~3,2 M€ (400 clients × 670€ ARPA)",
      note: "Digitalisation accélérée post-Chorus / facturation électronique.",
    },
    default: {
      tam: "~500 M€ (vertical SaaS B2B France)",
      sam: "~60 M€ (PME cible 5–50 salariés)",
      som: "~2 M€ (250 clients × 650€ ARPA)",
      note: "Estimation conservative — affiner avec 10 interviews.",
    },
  };
  return tams[sector] ?? tams.default;
}

export function defaultRoiInputs(avgTicket = 79): RoiInput[] {
  return [
    { id: "clients", label: "Clients payants visés (M12)", defaultValue: 50, min: 5, max: 500, unit: "" },
    { id: "price", label: "Prix mensuel moyen", defaultValue: avgTicket, min: 19, max: 299, unit: "€" },
    { id: "hours", label: "Heures économisées / client / mois", defaultValue: 4, min: 1, max: 20, unit: "h" },
    { id: "hourly", label: "Coût horaire client", defaultValue: 45, min: 20, max: 120, unit: "€/h" },
  ];
}

export function defaultCompetitionAlerts(): CompetitionAlert[] {
  return [
    { date: "Il y a 3 j", title: "Nouveau clone FR détecté sur Product Hunt", impact: "medium" },
    { date: "Il y a 1 sem.", title: "Concurrent US lève une seed — expansion EU probable", impact: "high" },
    { date: "Il y a 2 sem.", title: "Baisse de 12% du trafic SEO d'un acteur FR", impact: "low" },
  ];
}

export function enrichOpportunity(opportunity: Opportunity): Opportunity {
  const voice = opportunity.aiPowered && opportunity.sector === "healthcare";

  return {
    ...opportunity,
    foreignMarketProfile:
      opportunity.foreignMarketProfile ?? defaultForeignMarketProfile(opportunity),
    infraCosts: opportunity.infraCosts ?? defaultInfraCosts(voice),
    frenchCompetitors:
      opportunity.frenchCompetitors ?? defaultFrenchCompetitors(opportunity.targetClient),
    launchTimeline:
      opportunity.launchTimeline ?? defaultLaunchTimeline(opportunity.targetClient),
    emailTemplates:
      opportunity.emailTemplates ?? defaultEmailTemplates(opportunity.targetClient),
    partnersFR: opportunity.partnersFR ?? defaultPartnersFR(opportunity.sector),
    roiInputs:
      opportunity.roiInputs ??
      defaultRoiInputs(opportunity.financialScenarios[1]?.avgPrice ?? 79),
    tamBreakdown: opportunity.tamBreakdown ?? defaultTamBreakdown(opportunity.sector),
    competitionAlerts: opportunity.competitionAlerts ?? defaultCompetitionAlerts(),
  };
}

export function totalInfraMonthly(costs: InfraCost[]): number {
  return costs.reduce((sum, c) => sum + c.estimate, 0);
}
