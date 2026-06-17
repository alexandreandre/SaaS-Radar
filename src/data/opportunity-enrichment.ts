import type {
  BuildPrompts,
  CompetitionAlert,
  EmailTemplate,
  ForeignMarketProfile,
  FrenchCompetitor,
  InfraCost,
  LaunchWeek,
  MvpPlan,
  Opportunity,
  PartnerLead,
  RoadmapStep,
  RoiInput,
  StackGuideEntry,
  TamBreakdown,
} from "@/types/opportunity";
import { getWhyItWorksFact, normalizeWhyItWorks } from "@/types/opportunity";

export function defaultStackGuide(stack: string[]): StackGuideEntry[] {
  const templates: Record<string, Omit<StackGuideEntry, "tool">> = {
    "next.js": {
      role: "Frontend + API routes",
      why: "App Router, déploiement Vercel, écosystème React mature",
      setup: "npx create-next-app@latest --typescript --tailwind --app",
      freeTier: "Vercel Hobby gratuit",
      alternative: "Remix",
    },
    supabase: {
      role: "Base de données + Auth",
      why: "PostgreSQL managé, auth email/OAuth, RLS natif",
      setup: "Créer un projet sur supabase.com → copier URL + anon key",
      freeTier: "500 Mo DB, 50k MAU auth",
      alternative: "Neon + Clerk",
    },
    stripe: {
      role: "Paiements récurrents",
      why: "Checkout, abonnements, webhooks fiables en France",
      setup: "Dashboard Stripe → Products → activer le mode test",
      freeTier: "Pas de frais fixes — 1,5 % + 0,25 € en EU",
      alternative: "Lemon Squeezy (B2C)",
    },
    tailwind: {
      role: "Styles UI",
      why: "Utility-first, cohérence rapide, dark mode simple",
      setup: "Inclus avec create-next-app --tailwind",
      freeTier: "Open source",
      alternative: "CSS modules",
    },
    resend: {
      role: "Emails transactionnels",
      why: "API simple, bon deliverability, domaine custom",
      setup: "resend.com → API key → vérifier domaine",
      freeTier: "3 000 emails/mois",
      alternative: "Postmark",
    },
  };

  return stack.map((tool) => {
    const key = Object.keys(templates).find((k) => tool.toLowerCase().includes(k));
    const base = key ? templates[key] : null;
    return {
      tool,
      role: base?.role ?? "Composant stack",
      why: base?.why ?? "Recommandé pour un MVP solo rapide",
      setup: base?.setup ?? `Configurer ${tool} selon la doc officielle`,
      freeTier: base?.freeTier,
      alternative: base?.alternative,
    };
  });
}

export function defaultPitfalls(sector: string): string[] {
  const common = [
    "Ne pas valider le paiement avant J15 — risque de construire sans monétisation",
    "Scope creep : chaque feature hors MVP repousse le premier client de 1 semaine",
    "Ignorer l'onboarding : 80 % des bêtas abandonnent sans guide au premier usage",
  ];
  if (sector === "healthcare") {
    return [
      ...common,
      "Sous-estimer la conformité RGPD santé — prévoir mentions légales et hébergement EU",
    ];
  }
  return common;
}

export function defaultLaunchChecklist(name: string): string[] {
  return [
    `Landing ${name} publique avec proposition de valeur en une phrase`,
    "Parcours signup → onboarding → action principale sans friction",
    "Stripe test ou live : un paiement complet validé de bout en bout",
    "5 utilisateurs bêta ayant complété le workflow principal",
    "Page légale (CGU, politique de confidentialité) en place",
    "Monitoring basique (Sentry ou logs Vercel) activé",
  ];
}

function enrichRoadmapStep(step: RoadmapStep, index: number, opportunity: Opportunity): RoadmapStep {
  const headline = step.tasks[0] ?? `Étape ${index + 1}`;
  return {
    ...step,
    week: step.week ?? (Math.min(4, Math.floor((index / 4) * 4) + 1) as 1 | 2 | 3 | 4),
    objective: step.objective ?? headline,
    checkpoint:
      step.checkpoint ??
      (index === opportunity.mvpPlan.roadmap.length - 1
        ? "MVP prêt pour 5 bêtas et landing publique"
        : `Livrable « ${headline} » fonctionnel et testé manuellement`),
    estimateHours: step.estimateHours ?? (index === 0 ? 8 : 12),
    buildPrompt:
      step.buildPrompt ??
      `Build step for ${opportunity.name} (${step.day}):\n\nObjective: ${step.objective ?? headline}\n\nTasks:\n${step.tasks.map((t) => `- ${t}`).join("\n")}\n\nStack: ${opportunity.mvpPlan.stack.join(", ")}\n\nDeliver a working increment. Use Next.js 14 App Router, Supabase, Stripe, shadcn/ui.`,
  };
}

export function enrichMvpPlan(opportunity: Opportunity): MvpPlan {
  const { mvpPlan } = opportunity;
  const roadmap = mvpPlan.roadmap.map((step, i) => enrichRoadmapStep(step, i, opportunity));

  return {
    ...mvpPlan,
    roadmap,
    stackGuide: mvpPlan.stackGuide ?? defaultStackGuide(mvpPlan.stack),
    pitfalls: mvpPlan.pitfalls ?? defaultPitfalls(opportunity.sector),
    launchChecklist: mvpPlan.launchChecklist ?? defaultLaunchChecklist(opportunity.name),
  };
}

export function defaultBuildPrompts(opportunity: Opportunity): BuildPrompts {
  const stack = opportunity.mvpPlan.stack.join(", ");
  return {
    scaffold: opportunity.claudePrompt,
    features: opportunity.mvpPlan.features.map((feature) => ({
      feature,
      prompt: `Implement "${feature}" for ${opportunity.name} (French market).\n\nStack: ${stack}\n\nRequirements:\n- Next.js 14 App Router + TypeScript\n- Supabase for auth and data\n- Stripe for billing if applicable\n- shadcn/ui + Tailwind\n- French UI copy\n\nFeature scope: ${feature} only — do not expand beyond MVP.`,
    })),
  };
}

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
    keyFeatures: [],
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
  const mvpPlan = enrichMvpPlan(opportunity);

  return {
    ...opportunity,
    mvpPlan,
    buildPrompts: opportunity.buildPrompts ?? defaultBuildPrompts({ ...opportunity, mvpPlan }),
    whyItWorks: normalizeWhyItWorks(opportunity.whyItWorks),
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
