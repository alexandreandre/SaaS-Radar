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

const featuredOverrides: Partial<Record<string, Partial<Opportunity>>> = {
  "ai-receptionist-dental": {
    foreignMarketProfile: {
      productName: "Arini",
      country: "États-Unis",
      flag: "🇺🇸",
      tagline: "Réceptionniste IA 24/7 pour cabinets dentaires — répond, qualifie, prend RDV.",
      problemSolved:
        "Les cabinets US perdent 15–25 % des appels entrants. Chaque appel manqué = 200–500 $ de production non capturée. Arini remplace un standard humain coûteux.",
      targetUsers: "Cabinets dentaires privés (1–8 praticiens), majoritairement Sun Belt et côte Est.",
      businessModel: "SaaS B2B par cabinet, onboarding en 48 h avec script vocal personnalisé.",
      pricing: "299–599 $/mois/cabinet selon volume d'appels · pas de frais par minute en standard",
      keyFeatures: [
        "Numéro dédié + agent vocal IA (anglais, accents locaux)",
        "Qualification urgence / nouveau patient / admin",
        "Prise de RDV synchronisée Dentrix / Open Dental",
        "SMS de confirmation patient",
        "Dashboard : appels traités, RDV bookés, revenu récupéré estimé",
      ],
      howItWorks:
        "Le cabinet forward son numéro ou active un numéro Arini. L'IA répond avec le nom du cabinet, pose 3–5 questions métier, propose des créneaux et confirme. L'équipe reçoit un résumé + RDV dans le PMS.",
      whyItWorksThere: [
        "Douleur immédiate et chiffrable — le ROI se vend en une démo de 15 min.",
        "Marché US habitué à payer cher pour la productivité cabinet (PMS + marketing + téléphonie).",
        "Peu de concurrence IA verticale dentaire en 2023–2024 ; first mover sur la niche.",
      ],
      tractionHighlights: [
        { label: "MRR estimé", value: "~42 000 $", source: "GetLatka", sourceUrl: "https://getlatka.com" },
        { label: "Cabinets clients", value: "140+", source: "LinkedIn fondateur", sourceUrl: "https://linkedin.com" },
        { label: "Trafic organique", value: "28k visites/mois", source: "SimilarWeb", sourceUrl: "https://similarweb.com" },
        { label: "Presse / communauté", value: "Product Hunt #2", source: "PH 2024", sourceUrl: "https://producthunt.com" },
      ],
      franceAdaptation: [
        "La problématique existe : 68% des cabinets indépendants n'ont pas de standard téléphonique dédié.",
        "Clients équivalents : 28 000 cabinets dentaires privés en France. Cible idéale : 1-3 dentistes, hors groupes.",
        "Blockers : certification HDS si stockage de données patients. Solution : ne stocker que métadonnées RDV, pas dossiers médicaux.",
      ],
    },
    infraCosts: defaultInfraCosts(true),
    tamBreakdown: defaultTamBreakdown("healthcare"),
    frenchCompetitors: [
      { name: "Doctolib (agenda)", positioning: "Monopole RDV en ligne", pricing: "Inclus abonnement", strength: "Distribution massive", weakness: "Pas de réception téléphonique IA" },
      { name: "Agences call center santé", positioning: "Humain externalisé", pricing: "600–1200€/mois", strength: "Qualité relationnelle", weakness: "Coût, horaires limités" },
      { name: "AlloCabinet", positioning: "Standard téléphonique médical", pricing: "199€/mois", strength: "Spécialisation santé", weakness: "Pas d'IA, file d'attente classique" },
      { name: "Ringover / Aircall", positioning: "Téléphonie générique", pricing: "49–99€/user", strength: "Fiabilité", weakness: "Pas de prise de RDV métier" },
      { name: "Arini (US)", positioning: "IA réceptionniste dentaire", pricing: "$299–599/mois", strength: "Produit mature US", weakness: "Pas localisé FR / HDS" },
    ],
    launchTimeline: defaultLaunchTimeline("cabinets dentaires"),
    emailTemplates: defaultEmailTemplates("cabinets dentaires"),
    partnersFR: defaultPartnersFR("healthcare"),
    roiInputs: defaultRoiInputs(149),
    competitionAlerts: defaultCompetitionAlerts(),
  },
  "sms-reminder-physio": {
    foreignMarketProfile: {
      productName: "RemindPhysio",
      country: "Canada",
      flag: "🇨🇦",
      tagline: "Rappels SMS intelligents pour kinés — moins de no-shows, plus de séances facturées.",
      problemSolved:
        "Les kinés canadiens perdent 8–15 % de revenus en rendez-vous non honorés. RemindPhysio automatise rappels J-1 / H-2 avec ton personnalisé.",
      targetUsers: "Kinésithérapeutes libéraux et petits cabinets (1–4 praticiens) au Québec et Ontario.",
      businessModel: "Abonnement mensuel bas coût, volume élevé, activation en self-serve.",
      pricing: "39 CAD/mois · SMS illimités raisonnables · pas de setup",
      keyFeatures: [
        "Import patients CSV ou sync agenda",
        "Séquences SMS J-3, J-1, H-2",
        "Réponse OUI/NON pour confirmation",
        "Stats no-show avant / après",
        "Modèles par pathologie (post-op, chronic, sport)",
      ],
      howItWorks:
        "Le kiné connecte son agenda (Google ou export). À chaque RDV, RemindPhysio envoie les SMS. Le patient confirme ; le praticien voit le tableau de bord des absences évitées.",
      whyItWorksThere: [
        "Marché canadien bilingue, SMS très lus — meilleur canal que l'email pour les patients.",
        "Ticket bas = décision rapide sans comité d'achat.",
        "Intégrations légères vs ERP médical lourd.",
      ],
      tractionHighlights: [
        { label: "MRR estimé", value: "~18 000 CAD", source: "Estimation niche" },
        { label: "Utilisateurs actifs", value: "450+", source: "Témoignages site" },
        { label: "Réduction no-shows", value: "−38 % en moyenne", source: "Case study publiée" },
        { label: "NPS déclaré", value: "62", source: "Landing" },
      ],
    },
    infraCosts: defaultInfraCosts(false),
    tamBreakdown: {
      tam: "~320 M€ (logiciels kiné & rééducation)",
      sam: "~45 M€ (libéraux + cabinets <5 kinés)",
      som: "~1,8 M€ (600 clients × 25€ ARPA)",
      note: "No-shows = douleur universelle, willingness to pay faible mais volume élevé.",
    },
    frenchCompetitors: [
      { name: "Doctolib", positioning: "Agenda + rappels basiques", pricing: "Inclus", strength: "Adoption massive", weakness: "SMS non personnalisés par protocole" },
      { name: "Kinésithérapie.fr (legacy)", positioning: "Site + agenda simple", pricing: "15–30€/mois", strength: "Prix bas", weakness: "UX datée, pas de SMS automation" },
      { name: "Excel + SMS manuel", positioning: "DIY", pricing: "0€", strength: "Gratuit", weakness: "Oublis, pas de stats" },
      { name: "Mindbody (import)", positioning: "Wellness généraliste", pricing: "99€+/mois", strength: "Feature-rich", weakness: "Sur-dimensionné kiné pur" },
      { name: "RemindPhysio (CA)", positioning: "SMS kiné vertical", pricing: "CAD 39/mois", strength: "PMF prouvé", weakness: "Pas en FR" },
    ],
    launchTimeline: defaultLaunchTimeline("kinésithérapeutes"),
    emailTemplates: defaultEmailTemplates("kinés"),
    partnersFR: defaultPartnersFR("healthcare"),
    roiInputs: defaultRoiInputs(39),
    competitionAlerts: defaultCompetitionAlerts(),
  },
  "quote-generator-contractors": {
    foreignMarketProfile: {
      productName: "QuoteSnap",
      country: "Royaume-Uni",
      flag: "🇬🇧",
      tagline: "Devis chantier en 2 min sur mobile — photo → ligne de devis → PDF client.",
      problemSolved:
        "Les artisans UK perdent des chantiers faute de devis rapide. QuoteSnap transforme une photo terrain en devis structuré avec marges.",
      targetUsers: "Artisans solo et petites entreprises BTP (plombier, électricien, rénovation).",
      businessModel: "SaaS mobile-first + essai 14 jours, upgrade Pro pour IA photo.",
      pricing: "49 £/mois Pro · 19 £/mois Starter (devis limités)",
      keyFeatures: [
        "Bibliothèque ouvrages + prix unitaires",
        "IA : photo → suggestion lignes de devis",
        "PDF brandé + signature électronique",
        "Suivi « devis envoyé / accepté »",
        "Export compta (Xero, QuickBooks UK)",
      ],
      howItWorks:
        "Sur chantier, l'artisan prend des photos, sélectionne le type de travaux, ajuste les lignes, envoie le PDF. Le client signe sur mobile ; le statut remonte dans le dashboard.",
      whyItWorksThere: [
        "Culture « paperless » BTP accélérée post-Brexit + pénurie main-d'œuvre = besoin vitesse.",
        "Concurrence dominée par desktop lourd — UX mobile différenciante.",
        "IA photo = wow effect en démo terrain.",
      ],
      tractionHighlights: [
        { label: "MRR estimé", value: "~25 000 £", source: "Estimation marché" },
        { label: "Devis générés / mois", value: "12 000+", source: "Blog produit" },
        { label: "App Store BTP", value: "4.7★ (180 avis)", source: "iOS UK" },
        { label: "SEO UK", value: "Top 5 « quote app tradesman »", source: "Ahrefs" },
      ],
    },
    infraCosts: [
      ...defaultInfraCosts(false).slice(0, 4),
      { item: "OpenAI Vision (devis photo)", estimate: 55, note: "~500 analyses/mois", alternative: "Gemini Flash moins cher" },
      { item: "Signature électronique (Yousign)", estimate: 30, note: "10 signatures/mois incluses", alternative: "DocuSign API" },
    ],
    tamBreakdown: defaultTamBreakdown("construction"),
    frenchCompetitors: [
      { name: "Obat", positioning: "Devis + facturation BTP", pricing: "59–149€/mois", strength: "Conformité FR", weakness: "Desktop-first, IA absente" },
      { name: "Batappli", positioning: "Gestion chantier complète", pricing: "89€/mois", strength: "Complétude", weakness: "Courbe d'apprentissage" },
      { name: "Excel + Word", positioning: "Gratuit", pricing: "0€", strength: "Connu", weakness: "Erreurs, pas mobile" },
      { name: "Tolteck", positioning: "Devis BTP desktop", pricing: "Licence ~800€", strength: "Métier précis", weakness: "Pas SaaS, pas mobile" },
      { name: "QuoteSnap (UK)", positioning: "Mobile devis + IA photo", pricing: "£49/mois", strength: "UX terrain", weakness: "Mentions légales FR absentes" },
    ],
    launchTimeline: defaultLaunchTimeline("artisans BTP"),
    emailTemplates: defaultEmailTemplates("artisans BTP"),
    partnersFR: defaultPartnersFR("construction"),
    roiInputs: defaultRoiInputs(59),
    competitionAlerts: defaultCompetitionAlerts(),
  },
};

export function enrichOpportunity(opportunity: Opportunity): Opportunity {
  const overrides = featuredOverrides[opportunity.slug] ?? {};
  const voice = opportunity.aiPowered && opportunity.sector === "healthcare";

  return {
    ...opportunity,
    foreignMarketProfile:
      overrides.foreignMarketProfile ??
      opportunity.foreignMarketProfile ??
      defaultForeignMarketProfile(opportunity),
    infraCosts: overrides.infraCosts ?? opportunity.infraCosts ?? defaultInfraCosts(voice),
    frenchCompetitors:
      overrides.frenchCompetitors ??
      opportunity.frenchCompetitors ??
      defaultFrenchCompetitors(opportunity.targetClient),
    launchTimeline:
      overrides.launchTimeline ?? opportunity.launchTimeline ?? defaultLaunchTimeline(opportunity.targetClient),
    emailTemplates:
      overrides.emailTemplates ?? opportunity.emailTemplates ?? defaultEmailTemplates(opportunity.targetClient),
    partnersFR:
      overrides.partnersFR ?? opportunity.partnersFR ?? defaultPartnersFR(opportunity.sector),
    roiInputs: overrides.roiInputs ?? opportunity.roiInputs ?? defaultRoiInputs(opportunity.financialScenarios[1]?.avgPrice ?? 79),
    tamBreakdown: overrides.tamBreakdown ?? opportunity.tamBreakdown ?? defaultTamBreakdown(opportunity.sector),
    competitionAlerts:
      overrides.competitionAlerts ?? opportunity.competitionAlerts ?? defaultCompetitionAlerts(),
  };
}

export function totalInfraMonthly(costs: InfraCost[]): number {
  return costs.reduce((sum, c) => sum + c.estimate, 0);
}
