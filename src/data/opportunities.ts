import type { Opportunity } from "@/types/opportunity";

const baseMvp = (name: string, target: string, features: string[]): Opportunity["mvpPlan"] => ({
  features,
  notYet: ["Multi-tenant enterprise", "Mobile native app", "Advanced analytics", "White-label"],
  stack: ["Next.js 14", "Supabase", "Stripe", "Tailwind CSS", "Resend"],
  roadmap: [
    { day: "J1-2", tasks: ["Setup repo, auth, DB schema"] },
    { day: "J3-5", tasks: ["Core workflow MVP", "Stripe checkout"] },
    { day: "J6-8", tasks: ["Dashboard + onboarding"] },
    { day: "J9-11", tasks: ["Email notifications", "Settings"] },
    { day: "J12-14", tasks: ["Landing page", "5 beta users"] },
  ],
});

const baseCac: Opportunity["cacChannels"] = [
  { channel: "Cold email", estimate: 80, note: "Liste qualifiée, 3 relances max" },
  { channel: "LinkedIn", estimate: 200, note: "Outreach fondateur + contenu niche" },
  { channel: "SEO", estimate: 40, note: "Long terme, mots-clés métier FR" },
  { channel: "Referral", estimate: 30, note: "Partenariats cabinets / associations" },
];

const baseAcquisition = (niche: string): Opportunity["acquisition"] => [
  {
    id: "cold-email",
    title: "Cold Email",
    tactics: [
      `Scraper les ${niche} sur Pages Jaunes + vérifier emails via Hunter`,
      "Séquence 4 emails : problème → preuve sociale US → démo 15 min → break-up",
      "Personnaliser avec le nom du cabinet et une stat locale",
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    tactics: [
      "Publier 3 posts/semaine sur les douleurs du métier en France",
      "DM 20 prospects/semaine après engagement sur un post",
      "Commenter les posts des associations professionnelles",
    ],
  },
  {
    id: "seo",
    title: "SEO",
    tactics: [
      `Cibler « logiciel ${niche} France » et variantes long-tail`,
      "Comparer votre solution vs Excel / papier (intent commercial)",
      "Études de cas avec chiffres MRR anonymisés",
    ],
  },
  {
    id: "partnerships",
    title: "Partenariats locaux",
    tactics: [
      "Webinaires co-brandés avec un expert-comptable ou consultant métier",
      "Offre 3 mois gratuits pour les 10 premiers partenaires référents",
      "Stand sur salons professionnels régionaux (coût faible, leads chauds)",
    ],
  },
];

const baseFinancial: Opportunity["financialScenarios"] = [
  { name: "Prudent", clients: 20, avgPrice: 49, mrr: 980, grossMargin: 80 },
  { name: "Réaliste", clients: 100, avgPrice: 79, mrr: 7900, grossMargin: 85 },
  { name: "Optimiste", clients: 500, avgPrice: 99, mrr: 49500, grossMargin: 88 },
];

export const opportunities: Opportunity[] = [
  {
    id: "1",
    slug: "ai-receptionist-dental",
    name: "Réceptionniste IA pour cabinets dentaires",
    pitch: "Ne ratez plus un appel patient — l'IA répond, qualifie et prend RDV 24/7.",
    originCountry: "États-Unis",
    originCountryCode: "US",
    originFlag: "🇺🇸",
    sector: "healthcare",
    targetClient: "Cabinets dentaires privés (1-5 praticiens)",
    clientType: "b2b",
    techComplexity: "medium",
    franceCompetition: "low",
    revenueMin: 8000,
    revenueMax: 35000,
    buildableUnder30Days: true,
    boringBusiness: true,
    aiPowered: true,
    lowCompetition: true,
    scores: { opportunity: 87, franceFit: 8.2, buildability: 7.5, margin: 8.5, competitionGap: 8.8 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "RGPD + hébergement santé (HDS recommandé pour données patients)",
      competitors: "Quelques agences call center, pas de SaaS IA dominant",
      cultureFit: "Fort — les cabinets français perdent des RDV par téléphone occupé",
    },
    tractionSignals: [
      { label: "MRR concurrent US", value: "$42k", source: "GetLatka" },
      { label: "Backlinks", value: "1,240", source: "Ahrefs" },
      { label: "Mentions Reddit/IH", value: "89", source: "Reddit + IH" },
      { label: "Avis App Store", value: "4.6★ (312)", source: "App Store" },
    ],
    whyItWorks: [
      "Les cabinets dentaires perdent en moyenne 15-20% des appels entrants. Chaque appel manqué = 150-400€ de soin non capturé.",
      "Le modèle US facture 299-599$/mois par cabinet. La douleur est immédiate et le ROI se calcule en une semaine.",
      "L'IA vocale française a atteint un niveau de qualité acceptable en 2024-2025. Les cabinets cherchent des alternatives aux réceptionnistes à temps partiel difficiles à recruter.",
    ],
    franceAnalysis: [
      "La problématique existe : 68% des cabinets indépendants n'ont pas de standard téléphonique dédié.",
      "Clients équivalents : 28 000 cabinets dentaires privés en France. Cible idéale : 1-3 dentistes, hors groupes.",
      "Blockers : certification HDS si stockage de données patients. Solution : ne stocker que métadonnées RDV, pas dossiers médicaux.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("DentalVoice", "cabinets dentaires", [
      "Numéro dédié + IA vocale FR",
      "Prise de RDV Doctolib/calendrier",
      "SMS confirmation patient",
      "Dashboard appels manqués vs pris",
    ]),
    claudePrompt: `You are an expert full-stack developer. Build a B2B SaaS for private dental practices in France.

Problem: Practices miss 15-20% of inbound calls, losing €150-400 per missed appointment.

Solution: AI phone receptionist that answers 24/7, qualifies callers, and books appointments.

Stack: Next.js 14, Supabase, Stripe, Tailwind CSS, Twilio/Vapi for voice

MVP features:
- Dedicated French phone number
- AI voice agent (French) with appointment booking
- Calendar sync (Google Calendar / Doctolib webhook)
- SMS confirmation to patients
- Dashboard: calls handled, missed vs booked, revenue recovered estimate

Do NOT build: Full EMR, billing, multi-location enterprise, mobile app

Pages: dashboard, calls log, calendar settings, AI script editor, billing, onboarding

Start with landing page + Stripe checkout at €149/mo.`,
    acquisition: baseAcquisition("cabinets dentaires"),
    entrepreneursBuilding: 12,
    foreignInspiration: "Arini (US) — AI receptionist for dental",
    createdAt: "2025-05-01",
    weeklyPick: true,
  },
  {
    id: "2",
    slug: "sms-reminder-physio",
    name: "Rappels SMS pour kinés indépendants",
    pitch: "Réduisez les no-shows de 40% avec des rappels SMS automatiques et personnalisés.",
    originCountry: "Canada",
    originCountryCode: "CA",
    originFlag: "🇨🇦",
    sector: "healthcare",
    targetClient: "Kinésithérapeutes libéraux",
    clientType: "b2b",
    techComplexity: "low",
    franceCompetition: "low",
    revenueMin: 3000,
    revenueMax: 18000,
    buildableUnder30Days: true,
    boringBusiness: true,
    aiPowered: false,
    lowCompetition: true,
    scores: { opportunity: 78, franceFit: 9.0, buildability: 9.2, margin: 7.8, competitionGap: 8.5 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "RGPD — consentement SMS explicite",
      competitors: "Doctolib partiellement, pas de solution SMS dédiée kiné",
      cultureFit: "Excellent — les kinés français détestent les lapins",
    },
    tractionSignals: [
      { label: "MRR concurrent CA", value: "CAD $18k", source: "LinkedIn" },
      { label: "Backlinks", value: "340", source: "Ahrefs" },
      { label: "Mentions Reddit/IH", value: "34", source: "Reddit" },
      { label: "Avis G2", value: "4.4★ (89)", source: "G2" },
    ],
    whyItWorks: [
      "Un no-show kiné = 25-60€ perdus + créneau vide. À 8 no-shows/mois, c'est 200-480€ de manque à gagner.",
      "Les solutions généralistes (Doctolib) ne font pas de SMS personnalisés par protocole de soin.",
      "Stack technique trivial : Twilio + cron + interface minimaliste.",
    ],
    franceAnalysis: [
      "90 000 kinés en France, dont 60% en libéral. Problème universel.",
      "Pricing FR : 29-49€/mois acceptable vs 1 no-show évité.",
      "Intégration agenda : export iCal suffit pour V1.",
    ],
    financialScenarios: [
      { name: "Prudent", clients: 50, avgPrice: 29, mrr: 1450, grossMargin: 85 },
      { name: "Réaliste", clients: 300, avgPrice: 39, mrr: 11700, grossMargin: 88 },
      { name: "Optimiste", clients: 1200, avgPrice: 49, mrr: 58800, grossMargin: 90 },
    ],
    cacChannels: baseCac,
    mvpPlan: baseMvp("KineSMS", "kinés", ["Import agenda iCal", "SMS J-1 et H-2", "Templates par type de séance", "Stats no-shows"]),
    claudePrompt: `Build a B2B SaaS for independent physiotherapists in France to reduce no-shows via SMS reminders.

Stack: Next.js, Supabase, Stripe, Twilio
MVP: iCal import, automated SMS (24h + 2h before), templates, no-show dashboard
Do NOT build: Full practice management, billing patients
Pages: dashboard, appointments, SMS templates, settings, billing`,
    acquisition: baseAcquisition("kinésithérapeutes"),
    entrepreneursBuilding: 8,
    foreignInspiration: "RemindPhysio (Canada)",
    createdAt: "2025-04-28",
  },
  {
    id: "3",
    slug: "quote-generator-contractors",
    name: "Générateur de devis pour artisans BTP",
    pitch: "Créez des devis professionnels en 3 minutes depuis votre chantier.",
    originCountry: "Royaume-Uni",
    originCountryCode: "GB",
    originFlag: "🇬🇧",
    sector: "construction",
    targetClient: "Artisans du bâtiment (plombiers, électriciens, peintres)",
    clientType: "b2b",
    techComplexity: "low",
    franceCompetition: "medium",
    revenueMin: 5000,
    revenueMax: 25000,
    buildableUnder30Days: true,
    boringBusiness: true,
    aiPowered: true,
    lowCompetition: false,
    scores: { opportunity: 82, franceFit: 8.5, buildability: 8.8, margin: 8.0, competitionGap: 7.2 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Conformité devis (mentions légales FR)",
      competitors: "Obat, Batappli — mais UX mobile faible",
      cultureFit: "Très fort — artisans veulent simplicité mobile",
    },
    tractionSignals: [
      { label: "MRR concurrent UK", value: "£28k", source: "Companies House" },
      { label: "Backlinks", value: "890", source: "Ahrefs" },
      { label: "Mentions Reddit/IH", value: "56", source: "IH" },
      { label: "Avis Google Play", value: "4.3★ (1.2k)", source: "Play Store" },
    ],
    whyItWorks: [
      "Les artisans passent 4-6h/semaine sur Word/Excel pour des devis. Chaque heure = 50-80€ de chantier non facturé.",
      "L'IA peut estimer les quantités à partir de photos — différenciateur vs Excel.",
      "Marché fragmenté : 380 000 entreprises BTP <10 salariés en France.",
    ],
    franceAnalysis: [
      "Angle : mobile-first + IA photo-to-devis, pas un ERP complet.",
      "Mentions légales devis FR auto-générées (SIRET, assurance décennale).",
      "Concurrence sur le desktop, gap sur le 'depuis le chantier'.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("DevisFlash", "artisans BTP", ["Templates métiers", "Devis PDF conformes FR", "IA estimation photo", "Signature électronique"]),
    claudePrompt: `Build a mobile-first B2B SaaS for French construction contractors to create professional quotes in minutes.

Stack: Next.js, Supabase, Stripe, OpenAI Vision
MVP: Trade templates, FR-legal quote PDF, photo-to-estimate AI, e-signature
Pages: dashboard, quotes list, new quote wizard, clients, settings, billing`,
    acquisition: baseAcquisition("artisans BTP"),
    entrepreneursBuilding: 15,
    foreignInspiration: "QuoteSnap (UK)",
    createdAt: "2025-04-25",
  },
  {
    id: "4",
    slug: "hr-compliance-tracker",
    name: "Suivi conformité RH pour PME",
    pitch: "Ne ratez plus une échéance légale RH — registres, formations, DPAE automatisés.",
    originCountry: "États-Unis",
    originCountryCode: "US",
    originFlag: "🇺🇸",
    sector: "hr",
    targetClient: "DRH / Office managers PME 20-200 salariés",
    clientType: "b2b",
    techComplexity: "medium",
    franceCompetition: "low",
    revenueMin: 10000,
    revenueMax: 45000,
    buildableUnder30Days: false,
    boringBusiness: true,
    aiPowered: false,
    lowCompetition: true,
    scores: { opportunity: 85, franceFit: 7.8, buildability: 6.5, margin: 9.0, competitionGap: 8.2 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Code du travail FR — mises à jour fréquentes",
      competitors: "Payfit couvre paie, pas conformité proactive",
      cultureFit: "Bon — les PME françaises ont peur des contrôles URSSAF",
    },
    tractionSignals: [
      { label: "MRR concurrent US", value: "$95k", source: "GetLatka" },
      { label: "Backlinks", value: "2,100", source: "Ahrefs" },
      { label: "Mentions Reddit/IH", value: "42", source: "Reddit" },
      { label: "Avis Capterra", value: "4.5★ (201)", source: "Capterra" },
    ],
    whyItWorks: [
      "Les amendes URSSAF moyennes pour PME : 5 000-50 000€. Un outil à 149€/mois se vend seul.",
      "Le droit du travail FR change constamment — valeur = veille + alertes.",
      "Rétention élevée une fois les checklists configurées.",
    ],
    franceAnalysis: [
      "Adapter les checklists au Code du travail (pas FLSA US).",
      "Partenariat cabinets RH / avocats social pour crédibilité.",
      "RGPD pour données salariés — hébergement EU obligatoire.",
    ],
    financialScenarios: [
      { name: "Prudent", clients: 15, avgPrice: 99, mrr: 1485, grossMargin: 82 },
      { name: "Réaliste", clients: 80, avgPrice: 149, mrr: 11920, grossMargin: 86 },
      { name: "Optimiste", clients: 350, avgPrice: 199, mrr: 69650, grossMargin: 88 },
    ],
    cacChannels: baseCac,
    mvpPlan: baseMvp("RHConforme", "PME", ["Checklists Code du travail", "Alertes échéances", "Registre unique", "Export audit"]),
    claudePrompt: `Build a B2B SaaS for French SMB HR compliance tracking (deadlines, registers, training records).

Stack: Next.js, Supabase, Stripe
MVP: French labor law checklists, deadline alerts, single register, audit export
Do NOT build: Payroll, full HRIS
Pages: dashboard, compliance checklist, employees, alerts, settings, billing`,
    acquisition: baseAcquisition("DRH PME"),
    entrepreneursBuilding: 6,
    foreignInspiration: "ComplyHR (US)",
    createdAt: "2025-04-20",
  },
  {
    id: "5",
    slug: "accounting-client-portal",
    name: "Portail client pour cabinets comptables",
    pitch: "Vos clients déposent leurs pièces et suivent leur dossier sans email.",
    originCountry: "Australie",
    originCountryCode: "AU",
    originFlag: "🇦🇺",
    sector: "finance",
    targetClient: "Cabinets d'expertise comptable (5-30 collaborateurs)",
    clientType: "b2b",
    techComplexity: "medium",
    franceCompetition: "medium",
    revenueMin: 8000,
    revenueMax: 40000,
    buildableUnder30Days: false,
    boringBusiness: true,
    aiPowered: false,
    lowCompetition: false,
    scores: { opportunity: 80, franceFit: 8.8, buildability: 7.0, margin: 8.8, competitionGap: 7.5 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "RGPD + archivage légal 10 ans",
      competitors: "Pennylane côté client final, pas portail cabinet",
      cultureFit: "Excellent — les cabinets noient sous les emails",
    },
    tractionSignals: [
      { label: "MRR concurrent AU", value: "AUD $52k", source: "LinkedIn" },
      { label: "Backlinks", value: "670", source: "Ahrefs" },
      { label: "Mentions", value: "28", source: "IH" },
      { label: "Avis", value: "4.7★ (156)", source: "Capterra" },
    ],
    whyItWorks: [
      "Un cabinet moyen traite 400+ emails/mois de clients pour des pièces manquantes.",
      "Le portail réduit le SAV de 30% et justifie 50-100€/mois par client du cabinet.",
      "Vendu au cabinet (B2B2B), pas au particulier — panier moyen élevé.",
    ],
    franceAnalysis: [
      "22 000 cabinets en France. Cible : cabinets 5-20 personnes sans outil dédié.",
      "Intégration V1 : upload + messagerie. V2 : API Pennylane/Agiris.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("ComptaPortail", "cabinets comptables", ["Upload pièces", "Messagerie sécurisée", "Checklist mensuelle", "Multi-dossiers clients"]),
    claudePrompt: `Build a white-label client portal for French accounting firms.

Stack: Next.js, Supabase, Stripe, S3-compatible storage
MVP: Secure document upload, messaging, monthly checklist, multi-client
Pages: firm dashboard, client list, client portal view, settings, billing`,
    acquisition: baseAcquisition("experts-comptables"),
    entrepreneursBuilding: 9,
    foreignInspiration: "ClientVault (AU)",
    createdAt: "2025-04-18",
  },
  {
    id: "6",
    slug: "restaurant-inventory-ai",
    name: "Inventaire IA pour restaurants indépendants",
    pitch: "Comptez votre stock en photo — l'IA calcule les commandes fournisseurs.",
    originCountry: "États-Unis",
    originCountryCode: "US",
    originFlag: "🇺🇸",
    sector: "hospitality",
    targetClient: "Restaurants indépendants (1-3 établissements)",
    clientType: "b2b",
    techComplexity: "high",
    franceCompetition: "low",
    revenueMin: 6000,
    revenueMax: 28000,
    buildableUnder30Days: false,
    boringBusiness: true,
    aiPowered: true,
    lowCompetition: true,
    scores: { opportunity: 76, franceFit: 7.5, buildability: 6.0, margin: 7.5, competitionGap: 8.0 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Normes hygiène — pas de stockage images sensibles",
      competitors: "Melba, Supplize — mais pas IA photo",
      cultureFit: "Moyen — restaurateurs français peu tech",
    },
    tractionSignals: [
      { label: "MRR US", value: "$38k", source: "GetLatka" },
      { label: "Backlinks", value: "520", source: "Ahrefs" },
      { label: "Mentions IH", value: "67", source: "IH" },
      { label: "Avis", value: "4.2★ (89)", source: "G2" },
    ],
    whyItWorks: [
      "Le gaspillage alimentaire coûte 3-8% du CA restaurant. L'inventaire manuel prend 4h/semaine.",
      "Photo → quantités = wedge produit clair vs Excel.",
    ],
    franceAnalysis: [
      "Cibler brasseries et bistros parisiens d'abord — early adopters.",
      "Onboarding vidéo obligatoire — le métier n'est pas self-serve.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("StockSnap", "restaurants", ["Photo inventaire", "IA quantités", "Suggestions commande", "Historique gaspillage"]),
    claudePrompt: `Build AI-powered inventory management for independent French restaurants via photo recognition.

Stack: Next.js, Supabase, OpenAI Vision, Stripe
MVP: Photo inventory, AI quantity estimate, supplier order suggestions
Pages: dashboard, inventory scan, orders, suppliers, settings`,
    acquisition: baseAcquisition("restaurants indépendants"),
    entrepreneursBuilding: 4,
    foreignInspiration: "StockAI (US)",
    createdAt: "2025-04-15",
  },
  {
    id: "7",
    slug: "lawyer-time-billing",
    name: "Facturation au temps pour avocats solo",
    pitch: "Capturez chaque minute facturable — sync agenda, emails et appels.",
    originCountry: "Royaume-Uni",
    originCountryCode: "GB",
    originFlag: "🇬🇧",
    sector: "legal",
    targetClient: "Avocats libéraux et cabinets 1-5 avocats",
    clientType: "b2b",
    techComplexity: "medium",
    franceCompetition: "medium",
    revenueMin: 7000,
    revenueMax: 32000,
    buildableUnder30Days: false,
    boringBusiness: true,
    aiPowered: true,
    lowCompetition: false,
    scores: { opportunity: 74, franceFit: 8.0, buildability: 7.2, margin: 9.2, competitionGap: 6.8 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Secret professionnel — hébergement FR",
      competitors: "Secib, Kleos — lourds et chers",
      cultureFit: "Bon pour les avocats <40 ans",
    },
    tractionSignals: [
      { label: "MRR UK", value: "£35k", source: "LinkedIn" },
      { label: "Backlinks", value: "1,100", source: "Ahrefs" },
      { label: "Mentions", value: "45", source: "Reddit" },
      { label: "Avis", value: "4.5★ (178)", source: "G2" },
    ],
    whyItWorks: [
      "Les avocats sous-facturent 10-20% de leur temps. Récupérer 2h/mois = 400-800€.",
      "L'IA peut classifier les activités depuis Outlook/Google.",
    ],
    franceAnalysis: [
      "Adapter aux nomenclatures d'honoraires FR.",
      "Hébergement OVH/Scaleway pour crédibilité.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("LegalTime", "avocats", ["Timer intelligent", "Sync calendrier/email", "Factures PDF", "Rapport rentabilité dossier"]),
    claudePrompt: `Build time billing SaaS for solo French lawyers with AI activity capture from calendar/email.

Stack: Next.js, Supabase, Stripe, Google/Microsoft APIs
MVP: Smart timer, calendar sync, PDF invoices, matter profitability
Pages: dashboard, matters, time entries, invoices, settings, billing`,
    acquisition: baseAcquisition("avocats"),
    entrepreneursBuilding: 7,
    foreignInspiration: "TimeBrief (UK)",
    createdAt: "2025-04-12",
  },
  {
    id: "8",
    slug: "vet-appointment-reminder",
    name: "Rappels vaccins pour cliniques vétérinaires",
    pitch: "Fidélisez les propriétaires avec des rappels vaccins automatiques par SMS.",
    originCountry: "États-Unis",
    originCountryCode: "US",
    originFlag: "🇺🇸",
    sector: "healthcare",
    targetClient: "Cliniques vétérinaires indépendantes",
    clientType: "b2b",
    techComplexity: "low",
    franceCompetition: "low",
    revenueMin: 4000,
    revenueMax: 22000,
    buildableUnder30Days: true,
    boringBusiness: true,
    aiPowered: false,
    lowCompetition: true,
    scores: { opportunity: 79, franceFit: 8.7, buildability: 9.0, margin: 8.2, competitionGap: 8.5 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "RGPD propriétaires + données animaux",
      competitors: "Vetocom — pas de rappels proactifs SMS",
      cultureFit: "Très fort — marché pet care en croissance",
    },
    tractionSignals: [
      { label: "MRR US", value: "$31k", source: "GetLatka" },
      { label: "Backlinks", value: "410", source: "Ahrefs" },
      { label: "Mentions", value: "23", source: "Reddit" },
      { label: "Avis", value: "4.6★ (94)", source: "Capterra" },
    ],
    whyItWorks: [
      "40% des rappels vaccins sont oubliés par les propriétaires. Rebooking = 80-150€/visite.",
      "Les logiciels vétérinaires existants ont des modules rappels médiocres.",
    ],
    franceAnalysis: [
      "12 000 cliniques vétérinaires en France.",
      "Intégration Vetocom en V2 — V1 CSV import suffit.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("VetoRappel", "cliniques véto", ["Import patients", "Rappels SMS vaccins", "Stats rébooking", "Templates"]),
    claudePrompt: `Build SMS vaccine reminder SaaS for French veterinary clinics.

Stack: Next.js, Supabase, Twilio, Stripe
MVP: Patient import CSV, automated vaccine SMS, rebooking stats
Pages: dashboard, patients, reminders, templates, billing`,
    acquisition: baseAcquisition("vétérinaires"),
    entrepreneursBuilding: 5,
    foreignInspiration: "VetRemind (US)",
    createdAt: "2025-04-10",
  },
  {
    id: "9",
    slug: "freelance-contract-generator",
    name: "Contrats freelance conformes en 2 clics",
    pitch: "Générez des contrats de prestation conformes au droit français.",
    originCountry: "Allemagne",
    originCountryCode: "DE",
    originFlag: "🇩🇪",
    sector: "legal",
    targetClient: "Freelances et micro-agences (design, dev, marketing)",
    clientType: "b2c",
    techComplexity: "low",
    franceCompetition: "medium",
    revenueMin: 2000,
    revenueMax: 15000,
    buildableUnder30Days: true,
    boringBusiness: false,
    aiPowered: true,
    lowCompetition: false,
    scores: { opportunity: 72, franceFit: 9.2, buildability: 9.5, margin: 7.0, competitionGap: 6.5 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Droit des contrats FR + clauses IP",
      competitors: "Legalstart — one-shot, pas SaaS récurrent",
      cultureFit: "Excellent — explosion des freelances FR",
    },
    tractionSignals: [
      { label: "MRR DE", value: "€22k", source: "LinkedIn" },
      { label: "Backlinks", value: "2,400", source: "Ahrefs" },
      { label: "Mentions", value: "112", source: "IH + Reddit" },
      { label: "Avis", value: "4.4★ (340)", source: "Trustpilot" },
    ],
    whyItWorks: [
      "Un avocat pour un contrat : 300-800€. Un SaaS à 19€/mois avec mises à jour légales gagne.",
      "L'IA personnalise les clauses selon le métier (dev vs designer).",
    ],
    franceAnalysis: [
      "Modèles validés par avocat partenaire = trust.",
      "Upsell : facturation + relances impayés.",
    ],
    financialScenarios: [
      { name: "Prudent", clients: 100, avgPrice: 15, mrr: 1500, grossMargin: 90 },
      { name: "Réaliste", clients: 800, avgPrice: 19, mrr: 15200, grossMargin: 92 },
      { name: "Optimiste", clients: 4000, avgPrice: 29, mrr: 116000, grossMargin: 93 },
    ],
    cacChannels: baseCac,
    mvpPlan: baseMvp("ContratFreelance", "freelances", ["Templates par métier", "IA personnalisation", "E-signature", "Stockage cloud"]),
    claudePrompt: `Build a SaaS for French freelancers to generate compliant service contracts with AI customization.

Stack: Next.js, Supabase, Stripe, OpenAI
MVP: Trade templates, AI clause customization, e-signature, cloud storage
Pages: dashboard, contracts, new contract wizard, templates, billing`,
    acquisition: baseAcquisition("freelances"),
    entrepreneursBuilding: 18,
    foreignInspiration: "VertragPlus (DE)",
    createdAt: "2025-04-08",
  },
  {
    id: "10",
    slug: "property-inspection-reports",
    name: "Rapports d'état des lieux numériques",
    pitch: "Faites vos états des lieux sur tablette — photos, signatures, PDF instantané.",
    originCountry: "Royaume-Uni",
    originCountryCode: "GB",
    originFlag: "🇬🇧",
    sector: "legal",
    targetClient: "Agences immobilières et gestionnaires locatifs",
    clientType: "b2b",
    techComplexity: "medium",
    franceCompetition: "low",
    revenueMin: 6000,
    revenueMax: 30000,
    buildableUnder30Days: true,
    boringBusiness: true,
    aiPowered: false,
    lowCompetition: true,
    scores: { opportunity: 81, franceFit: 9.0, buildability: 8.0, margin: 8.0, competitionGap: 8.8 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Loi ALUR — états des lieux obligatoires",
      competitors: "Solutions papier/Word dominantes",
      cultureFit: "Excellent — obligation légale = budget garanti",
    },
    tractionSignals: [
      { label: "MRR UK", value: "£41k", source: "Companies House" },
      { label: "Backlinks", value: "780", source: "Ahrefs" },
      { label: "Mentions", value: "38", source: "Reddit" },
      { label: "Avis", value: "4.5★ (267)", source: "G2" },
    ],
    whyItWorks: [
      "Un état des litiges coûte 2 000-10 000€. Un outil à 79€/mois est évident.",
      "Le marché FR : 5M+ logements locatifs, rotation régulière.",
    ],
    franceAnalysis: [
      "Templates conformes loi ALUR avec mentions obligatoires.",
      "Mode offline tablette = killer feature pour agents terrain.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("EDLPro", "agences immo", ["Checklist pièce par pièce", "Photos géolocalisées", "Signatures", "PDF légal"]),
    claudePrompt: `Build digital property inspection report SaaS for French real estate agencies (état des lieux).

Stack: Next.js PWA, Supabase, Stripe
MVP: Room checklist, geotagged photos, signatures, ALUR-compliant PDF
Pages: dashboard, inspections, new inspection, properties, billing`,
    acquisition: baseAcquisition("agences immobilières"),
    entrepreneursBuilding: 11,
    foreignInspiration: "InspectPro (UK)",
    createdAt: "2025-04-05",
  },
  {
    id: "11",
    slug: "tutoring-scheduling-parent",
    name: "Planning cours particuliers pour profs indépendants",
    pitch: "Gérez vos élèves, créneaux et paiements — les parents réservent en ligne.",
    originCountry: "Canada",
    originCountryCode: "CA",
    originFlag: "🇨🇦",
    sector: "education",
    targetClient: "Professeurs particuliers indépendants",
    clientType: "b2b",
    techComplexity: "low",
    franceCompetition: "medium",
    revenueMin: 2500,
    revenueMax: 12000,
    buildableUnder30Days: true,
    boringBusiness: true,
    aiPowered: false,
    lowCompetition: false,
    scores: { opportunity: 70, franceFit: 8.5, buildability: 9.0, margin: 7.2, competitionGap: 6.8 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Statut auto-entrepreneur — facturation conforme",
      competitors: "AlloProf côté élèves, pas outil pro",
      cultureFit: "Fort — 100k+ profs particuliers en France",
    },
    tractionSignals: [
      { label: "MRR CA", value: "CAD $24k", source: "LinkedIn" },
      { label: "Backlinks", value: "290", source: "Ahrefs" },
      { label: "Mentions", value: "51", source: "IH" },
      { label: "Avis", value: "4.3★ (120)", source: "App Store" },
    ],
    whyItWorks: [
      "Les profs passent 3h/semaine sur WhatsApp pour caler des cours.",
      "Stripe Connect pour paiement direct = monétisation claire.",
    ],
    franceAnalysis: [
      "Interface en français, factures auto-entrepreneur auto.",
      "Niche : profs de langues et soutien scolaire lycée.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("ProfPlanning", "profs particuliers", ["Agenda en ligne", "Paiement Stripe", "Rappels SMS parents", "Factures AE"]),
    claudePrompt: `Build scheduling + payment SaaS for independent French tutoring teachers.

Stack: Next.js, Supabase, Stripe Connect
MVP: Online booking, Stripe payments, parent SMS reminders, auto-entrepreneur invoices
Pages: dashboard, students, schedule, payments, settings`,
    acquisition: baseAcquisition("professeurs particuliers"),
    entrepreneursBuilding: 14,
    foreignInspiration: "TutorFlow (CA)",
    createdAt: "2025-04-02",
  },
  {
    id: "12",
    slug: "cleaning-business-crm",
    name: "CRM léger pour entreprises de ménage",
    pitch: "Devis, planning équipes et facturation — tout en un pour sociétés de nettoyage.",
    originCountry: "Australie",
    originCountryCode: "AU",
    originFlag: "🇦🇺",
    sector: "retail",
    targetClient: "Entreprises de nettoyage (5-30 employés)",
    clientType: "b2b",
    techComplexity: "medium",
    franceCompetition: "low",
    revenueMin: 5000,
    revenueMax: 24000,
    buildableUnder30Days: false,
    boringBusiness: true,
    aiPowered: false,
    lowCompetition: true,
    scores: { opportunity: 77, franceFit: 8.3, buildability: 7.8, margin: 8.0, competitionGap: 8.0 },
    franceFitCriteria: {
      problemExists: true,
      regulation: "Droit du travail — planning équipes",
      competitors: "Aucun leader FR verticalisé",
      cultureFit: "Très fort — secteur ultra fragmenté",
    },
    tractionSignals: [
      { label: "MRR AU", value: "AUD $38k", source: "LinkedIn" },
      { label: "Backlinks", value: "450", source: "Ahrefs" },
      { label: "Mentions", value: "29", source: "Reddit" },
      { label: "Avis", value: "4.4★ (88)", source: "Capterra" },
    ],
    whyItWorks: [
      "Les sociétés de ménage utilisent WhatsApp + Excel. Un CRM vertical à 99€/mois remplace 3 outils.",
      "Le secteur recrute mal — la planification automatique = gain de temps massif.",
    ],
    franceAnalysis: [
      "15 000+ entreprises de nettoyage en France.",
      "Angle : 'fait pour le ménage', pas Salesforce générique.",
    ],
    financialScenarios: baseFinancial,
    cacChannels: baseCac,
    mvpPlan: baseMvp("CleanCRM", "entreprises ménage", ["Devis rapides", "Planning équipes", "Facturation récurrente", "App mobile équipe"]),
    claudePrompt: `Build vertical CRM for French cleaning companies (quotes, team scheduling, recurring billing).

Stack: Next.js, Supabase, Stripe
MVP: Quick quotes, team scheduling, recurring invoices, mobile team view
Pages: dashboard, clients, schedule, team, invoices, billing`,
    acquisition: baseAcquisition("entreprises de ménage"),
    entrepreneursBuilding: 3,
    foreignInspiration: "CleanOps (AU)",
    createdAt: "2025-04-01",
  },
];

export function getOpportunityBySlug(slug: string): Opportunity | undefined {
  return opportunities.find((o) => o.slug === slug);
}

export function getDealOfTheWeek(): Opportunity {
  return opportunities.find((o) => o.weeklyPick) ?? opportunities[0];
}

export const sectorLabels: Record<string, string> = {
  healthcare: "Santé",
  construction: "BTP",
  hr: "RH",
  finance: "Finance",
  legal: "Juridique",
  retail: "Services",
  education: "Éducation",
  hospitality: "Restauration",
};
