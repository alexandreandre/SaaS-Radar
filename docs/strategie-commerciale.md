# Stratégie commerciale — SaaS Radar
> Document de travail. Recommandations issues d'une analyse projet + marché du 15 juin 2026.
> Objectif fixé par le fondateur : **encaisser vite les premiers euros** (valider que ça se vend).
> Contraintes connues : encaissement Stripe **brancheable en quelques jours** (pas encore actif),
> prix encore en `XX€`, fondateur **disponible pour faire la vente active**.

---

## 0. Lexique express (à lire une fois)

Pour que tout soit clair même sans expérience de la vente :

- **Prospect** = un client potentiel pas encore client.
- **Lead** = un contact qui a montré un signe d'intérêt (inscription, DM, clic).
- **Tunnel / funnel** = le chemin d'un inconnu jusqu'au paiement.
- **Conversion** = transformer un intéressé en client payant. **Taux de conversion** = % qui passe à l'acte.
- **Self-serve** = le client achète seul, sans te parler (carte bancaire en ligne).
- **Founder-led sales** = c'est toi, le fondateur, qui vends à la main (DM, démo, appel).
- **ARPU** = revenu moyen par client payant. **MRR** = revenu récurrent mensuel. **ARR** = MRR × 12.
- **Churn** = taux de clients qui se désabonnent.
- **CAC** = coût d'acquisition d'un client. **LTV** = ce qu'un client rapporte sur sa durée de vie.
- **Tripwire** = petit produit pas cher (ici 29€/fiche) qui transforme un curieux en acheteur,
  pour ensuite lui vendre l'abonnement.
- **Affiliation** = on recommande un outil tiers (Qonto…) et on touche une commission par client apporté.
- **CPA** = "coût par acquisition" : l'affilieur te paie un montant fixe par client validé.

---

## 1. ANALYSE

### 1.1 Le projet (offre, prix, marge, cycle de vente, capacité)

**Ce qui est vendu, en une phrase.** Un abonnement à une plateforme qui (a) détecte chaque
semaine des micro-SaaS qui marchent à l'étranger et fournit le plan exact pour les construire
en France, et (b) offre un **cockpit de pilotage** qui compare la promesse de la fiche aux
vraies métriques du fondateur (via 30 connecteurs Stripe, Qonto, Google Ads…).

**À qui.** Cible cœur = **indie hackers / makers francophones** (savent coder ou "vibe-coder"),
freelances tech, solopreneurs no-code. B2C/prosumer : la personne qui paie est aussi celle qui
utilise. **Important : la plupart sont pré-revenu** (ils n'ont pas encore de SaaS rentable),
donc leur budget personnel est limité et la sensibilité au prix est forte.

**Prix envisagés (à confirmer, aujourd'hui `XX€`).**

| Palier | Prix proposé (hyp. BP) |
|--------|------------------------|
| Free | 0 € |
| Builder | 19 €/mois ou 180 €/an |
| Pro | 39 €/mois ou 372 €/an |
| À la carte | 29 €/fiche (achat unique) |

**Marge.** Quasi parfaite (~97 %) : pas d'inférence IA par utilisateur, coûts directs ~2-6 €/mois
au total. Conséquence commerciale décisive : **chaque euro encaissé est quasi du profit**, et on
peut se permettre des offres agressives (essais, remises de lancement, affiliation, commissions
aux apporteurs) sans détruire l'économie.

**Cycle de vente.** Très court côté self-serve (achat impulsif possible en quelques minutes pour
l'à-la-carte ou Builder). Plus long pour le cockpit/Pro, car la valeur (piloter son SaaS) ne se
révèle qu'après le lancement du projet de l'utilisateur.

**Différenciation.** Angle unique "**promesse vs réalité**" (le cockpit connaît la promesse
éditoriale de la fiche et mesure l'écart) + **localisation FR** (connecteurs compta Qonto,
Pennylane, Abby ; contenu adapté marché FR/RGPD). Aucun concurrent US ne fait ce lien
idée → exécution → pilotage.

**Capacité de livraison.** Illimitée et instantanée (SaaS, coût marginal nul). Le vrai goulot
n'est pas la livraison mais **(1) la capacité à encaisser** (Stripe pas encore branché) et
**(2) le volume de trafic/audience** pour alimenter le tunnel.

### 1.2 Le marché (sourcé)

**Comment et où achètent les makers francophones.** Ils ne "reçoivent pas de commerciaux" : ils
traînent dans des **communautés** et achètent sur recommandation / build-in-public. Principaux
points de présence FR :
- **IndieMakers.fr** — la communauté francophone de référence des indépendants qui bootstrappent
  SaaS/apps/infoproduits (Discord actif). Source : [FindSkill.ai — IA pour entrepreneurs (2026)](https://findskill.ai/fr/ia-pour-entrepreneurs/).
- **IA.Builders** — communauté 100% francophone des créateurs d'apps IA (Discord, meetups, channel #jobs).
  Source : [ia.builders](https://ia.builders/).
- **SoloTryb** — communauté de solopreneurs orientée feedback projet et "business entre membres".
  Source : [solotryb.com](https://solotryb.com/).
- **No Code Founders** — plateforme/Slack mondiale (30 000+ fondateurs, 5 000+ experts no-code).
  Source : [ToolMage — No Code Founders](https://www.toolmage.com/fr/tool/no-code-founders/).
- **Station F / incubateurs écoles** (Kedge, IP Paris, KIVO, Ynov…) — micro-équipes early-stage,
  fonctionnent avec des **"perks"** (offres outils privilégiées : AWS, HubSpot, Qonto, Stripe…).
  Source : [Kedge Entrepreneurship 2026](https://entrepreneurship.kedge.edu/actualites/incubateur-paris-2026-startup).
- **Distribution / encaissement sans infra** : Gumroad, Lemon Squeezy, Podia — utilisés par les
  makers FR pour vendre e-books, templates, micro-SaaS sans monter leur propre paiement.
  Source : [FindSkill.ai (2026)](https://findskill.ai/fr/ia-pour-entrepreneurs/).

**Prix pratiqués par les concurrents (bases d'idées).**
- **IdeaBrowser** : **499 $/an** (Starter), **1 499 $/an** (Pro), **2 999 $/an** (Empire) —
  **annuel uniquement**, pas de mensuel. Source : [ideabrowser.com/pricing](https://www.ideabrowser.com/pricing) (vérifié 2026-05).
- **Starter Story** : **39 $/mois** (facturé au trimestre) et **66 $/mois** (Academy) ; cours one-shot
  à 149–249 $. Source : [starterstory.com](https://www.starterstory.com/how-to-find-1m-ideas).
- **Trends.vc (Trends Pro)** : abonnement à une bibliothèque de 160+ rapports.
  Source : [access.trends.vc](https://access.trends.vc/?medium=email).
- **1mil.app** : modèle **freemium + Explorer/Pro mensuel via Stripe** (concurrent direct du modèle
  SaaS Radar). Source : [1mil.app comparatif](https://1mil.app/compare/ideabrowser-alternative/).

→ **Lecture prix.** Les leaders US sont **chers et annuels** (499 $+/an). SaaS Radar à 19/39 €/mois
est **nettement moins cher** : avantage d'accessibilité pour démarrer, mais **risque de signal
"moins premium"** et d'ARPU bas. Le marché tolère donc des prix bien supérieurs **si la valeur perçue
est là** (le cockpit + la localisation FR sont les arguments pour monter en gamme plus tard).

**Conversion freemium (référence sectorielle 2026).** Le freemium convertit en moyenne **2 à 5 %**
des inscrits gratuits en payants (médiane ~5,5 %, top performers 8-12 %), et met **90 à 180 jours**
à monétiser. À l'inverse, un **essai gratuit avec carte bancaire requise convertit à 25-35 %**, et
un essai sans carte à 15-25 %. Sources : [Artisan Strategies — SaaS Conversion Benchmarks 2026](https://www.artisangrowthstrategies.com/blog/saas-conversion-rate-benchmarks-2026-data-1200-companies),
[SaaSFactor — Freemium vs Trial](https://www.saasfactor.co/blogs/freemium-vs-trial-models-in-saas-what-really-boosts-conversions),
[Stackmatix](https://www.stackmatix.com/blog/freemium-to-paid-conversion).

**Revenu d'affiliation (connecteurs déjà recommandés dans le produit).**
- **Qonto** : modèle CPA, commission **~15 € à ~90 € par compte ouvert + bonus à l'activation**
  (jusqu'à ~90 €+20 € en zone EU selon performance), cookie ~30 jours.
  Sources : [Qonto Affiliate](https://qonto.com/fr/affiliate), [affi.io/m/qonto](https://affi.io/m/qonto),
  [The Affiliate Monkey](https://theaffiliatemonkey.com/affiliate/qonto-eu-affiliate-program/).
- **Brevo** : CPA fixe par compte payant, cookie **90 jours**, paiement via Partnerstack.
  Source : [Brevo Affiliés](https://www.brevo.com/fr/partners/affiliates/).
- **Pennylane** : programme d'affiliation "généreux" + partenariat éditeurs/intégrateurs (accès à
  1M d'entreprises, 7 500 cabinets). Source : [Pennylane Partenaires](https://www.pennylane.com/fr/partenaires).

**Objections classiques du secteur (à neutraliser).**
1. *"Je trouve des idées gratuitement sur Reddit / X / Indie Hackers."*
2. *"Encore un abonnement…"* (fatigue d'abonnement, budget perso serré).
3. *"Je n'ai pas encore de revenus, donc pas de budget pour un outil."*
4. *"Les idées générées par IA se valent toutes, je n'ai pas confiance."*
5. *"Le cockpit, je n'en ai pas besoin tant que je n'ai pas lancé."*

### 1.3 Synthèse & insights

- **Meilleurs acheteurs immédiats** : pas le débutant pré-revenu pré-idée (il veut du gratuit), mais
  le **maker qui a déjà décidé de lancer et cherche QUOI** (prêt à payer pour gagner des semaines),
  et le **maker qui a déjà un SaaS et veut piloter** (prêt à payer Pro/connecteurs).
- **Insight #1 — pour du cash RAPIDE, le freemium pur est trop lent** (90-180 j, 2-5 %). Il faut un
  levier d'encaissement immédiat : **vente à-la-carte (29€) en tripwire** + **offre "Founding Member"
  à durée limitée** + **essai Pro avec carte bancaire** (25-35 % de conversion vs 2-5 %).
- **Insight #2 — la découverte attire, le cockpit retient.** On vend l'**entrée par l'idée**
  ("voici LE micro-SaaS à lancer ce mois-ci"), pas par le cockpit (trop abstrait à froid).
- **Insight #3 — l'audience EST le canal de vente.** Sans pub, le cash vient des communautés FR +
  build-in-public + newsletter. La marge ~97 % permet de **rémunérer généreusement les apporteurs**
  (affiliation entrante) et de **toucher de l'affiliation sortante** (Qonto, Brevo, Pennylane).
- **Insight #4 — prix bas = arme de pénétration, pas de destination.** On démarre accessible pour
  encaisser vite, mais on garde la capacité de monter en gamme quand le cockpit + connecteurs réels
  justifient 39 €+.

### 1.4 Hypothèses / questions ouvertes

- ARPU réel et willingness-to-pay FR à valider par A/B test prix dès les premières ventes.
- Le cockpit réduit-il vraiment le churn ? Inconnu tant qu'il n'y a pas de payants récurrents.
- Connecteurs réels (Stripe d'abord) = condition pour vendre Pro à plein prix de façon crédible.

---

## 2. STRATÉGIE COMMERCIALE

> Logique directrice (alignée sur ton objectif "cash vite") : **encaisser des montants ponctuels
> immédiats** (à-la-carte, offre Founding Member, essais avec CB) pour valider que ça se vend,
> AVANT de courir après le MRR récurrent qui, en freemium, met des mois à se construire.

### 2.1 Modèle de tarification & justification du prix

On garde la structure du business plan **mais on ajoute 2 leviers de cash rapide** par-dessus.

| Offre | Prix recommandé | Rôle commercial | Pourquoi ce prix |
|-------|-----------------|-----------------|------------------|
| **Free** | 0 € | Aimant (top of funnel) : 3 idées/mois, scores, carte, newsletter | Indispensable : les makers FR attendent du gratuit (cf. communautés 100% gratuites). C'est le réservoir à convertir. |
| **À la carte** | **29 €/fiche** | **Tripwire cash** : 1 fiche complète (guide J1→J14 + business plan + prompt) | Achat impulsif, sans engagement. Neutralise l'objection "encore un abonnement". Marge ~100 %. Premier euro le plus facile à encaisser. |
| **Builder** | **19 €/mois** ou **180 €/an** (-21 %) | Cœur de gamme : exécution complète + cockpit (saisie manuelle) | Sous le seuil psychologique des 20 €, très en-dessous des 499 $/an d'IdeaBrowser → "oui" facile. L'annuel encaisse 180 € d'un coup (cash). |
| **Pro** | **39 €/mois** ou **372 €/an** | Premium : prompt Claude hebdo, connecteurs API réels, multi-projets | Reste 3× moins cher que Pro IdeaBrowser (1 499 $/an). À pousser **quand Stripe réel est branché** (sinon promesse creuse). |
| **Founding Member** (lancement, limité) | **149 € la 1ʳᵉ année** (ou lifetime 299 € plafonné à 50 places) | **Coup de cash immédiat** + base de fans + preuve sociale | Crée l'urgence (places limitées), finance le build, donne des témoignages. Classique des lancements indie. |
| **Essai Pro 7 jours, carte requise** | 0 € puis 39 €/mois | Booster de conversion | Un essai **avec CB convertit à 25-35 %** vs 2-5 % en freemium ([source](https://www.artisangrowthstrategies.com/blog/saas-conversion-rate-benchmarks-2026-data-1200-companies)). 7 jours > 30 jours (urgence). |

**Pourquoi ne PAS rester en freemium pur pour démarrer.** Le freemium met 90-180 jours à monétiser
et ne convertit qu'à 2-5 % — incompatible avec "encaisser vite". On superpose donc des **déclencheurs
d'achat immédiat** (à-la-carte, Founding, essai CB) qui encaissent dès la 1ʳᵉ semaine, puis le
freemium devient le moteur de fond à mesure que l'audience grossit.

**Règle d'annonce de prix (anti-bradage).** On affiche le prix **avec assurance, sans s'excuser**, et
on **ancre toujours sur le prix US** : *"IdeaBrowser, c'est 499 $/an. SaaS Radar Builder, c'est 19 €/mois,
en français, avec le cockpit pour piloter — pas juste une liste d'idées."*

### 2.2 Canaux de vente retenus (justifiés) & canaux écartés

**Retenus — par ordre de rapidité d'encaissement :**

| Canal | Pourquoi ICI (preuve) | Effort/Revenu |
|-------|------------------------|---------------|
| **Vente directe dans les communautés FR** (IndieMakers.fr, IA.Builders, SoloTryb, No Code Founders) | C'est **là que sont physiquement les acheteurs** et ils achètent sur recommandation/build-in-public ([source](https://findskill.ai/fr/ia-pour-entrepreneurs/)). Zéro coût d'accès. | ⭐⭐⭐ Élevé (gratuit, audience qualifiée, cycle court) |
| **Build-in-public sur X/LinkedIn** (publier les idées détectées chaque semaine + les chiffres) | Les makers FR consomment ce format ; chaque fiche = un post = un appel à acheter l'à-la-carte. | ⭐⭐⭐ Élevé (organique, compounding) |
| **Newsletter** (déjà dans le produit) | Top of funnel existant ; l'"idée de la semaine" gratuite → upsell à-la-carte/Builder. | ⭐⭐⭐ Élevé (asset possédé, coût ~0) |
| **Vente à-la-carte via Gumroad / Lemon Squeezy** | Permet d'**encaisser AVANT même Stripe branché** ; standard des makers FR ([source](https://findskill.ai/fr/ia-pour-entrepreneurs/)). Lemon Squeezy gère la TVA EU. | ⭐⭐⭐ Très élevé (cash immédiat, 0 dev) |
| **Affiliation sortante** (Qonto ~90 €, Brevo, Pennylane) | Déjà structurellement dans le produit (Stack Health recommande la stack). Revenu à marge ~100 %, sans vendre TON produit. | ⭐⭐ Bon (récurrent passif une fois posé) |
| **Partenariats communautés / créateurs** (revenue share) | Tu donnes un % ou un code promo à un animateur de communauté qui te recommande. Marge ~97 % le permet. | ⭐⭐ Bon |
| **B2B léger : perks incubateurs/écoles** (Kedge, IP Paris, Ynov, KIVO) | Ces programmes distribuent des "perks" outils à leurs incubés ([source](https://entrepreneurship.kedge.edu/actualites/incubateur-paris-2026-startup)). 1 deal = des dizaines de comptes. | ⭐ Moyen (cycle plus long, à activer en phase 2) |

**Écartés (et pourquoi) :**
- **Publicité payante (Google/Meta Ads) maintenant** : tu n'as pas encore de prix validés ni de tunnel
  de conversion prouvé. Payer pour du trafic qui ne convertit pas = brûler du cash. À tester **seulement
  après** avoir un taux de conversion connu et un LTV mesuré.
- **Marketplaces de revente de sites** (VenteSiteInternet, Dealing-Room) : c'est pour **vendre le SaaS lui-même**,
  pas tes abonnements. Hors sujet tant que tu n'es pas en logique d'exit.
- **Démarchage à froid B2B massif (cold call entreprises)** : ta cible est B2C/maker, pas l'entreprise
  classique ; le cold call est inadapté et chronophage pour un panier de 19-39 €.
- **Cours/formation packagée** : disperse le focus produit ; LiveMentor & co occupent déjà le terrain.

### 2.3 Cibles de prospects à fort potentiel (profils précis)

1. **"Le maker prêt à lancer" (cible #1, achat le plus rapide).**
   - Qui : développeur/no-codeur FR qui poste "je cherche quoi build" ou "j'ai du temps ce mois-ci".
   - Douleur : peur de perdre des semaines sur une mauvaise idée.
   - Déclencheur d'achat : une fiche concrète "voici LE SaaS à lancer, voici le plan J1→J14".
   - Où le trouver : Discord IndieMakers/IA.Builders (channels #projet, #idées), threads X "build in public".
   - Offre à pousser : **à-la-carte 29 €** puis **Builder**.

2. **"Le fondateur qui a déjà un SaaS et pilote mal" (meilleur LTV).**
   - Qui : a un produit live, jongle entre Stripe/analytics/compta, veut une vue unique.
   - Douleur : ne sait pas s'il tient sa promesse de croissance ; dashboards éparpillés.
   - Déclencheur : la démo du cockpit "promesse vs réalité" + connecteurs FR (Qonto).
   - Où : SoloTryb, threads MRR sur X, comments "j'ai atteint X€ MRR".
   - Offre : **Pro** (essai 7 j avec CB) + affiliation Qonto/Pennylane.

3. **"Le responsable de programme d'incubateur/école" (B2B phase 2, gros volume).**
   - Qui : program manager d'un incubateur étudiant qui cherche des perks pour ses incubés.
   - Douleur : doit offrir des outils utiles et structurants à des fondateurs débutants.
   - Déclencheur : offre de licences groupées / accès offert contre visibilité.
   - Où : Station F, Kedge, Ynov, KIVO, IP Paris (LinkedIn + email direct).
   - Offre : **licence groupée / partenariat perk**.

### 2.4 Argumentaire de vente

**Proposition de valeur (1 phrase, orientée bénéfice) :**
> *"SaaS Radar te dit chaque semaine quel micro-SaaS lancer en France, te donne le plan exact pour
> le construire en 14 jours, et te montre noir sur blanc si tu tiens ta promesse de croissance —
> au lieu de deviner."*

**Preuves qui rassurent (à réunir/afficher) :**
- Captures réelles de fiches (scores, scénarios financiers, prompt Claude).
- Démo vidéo de 60 s du cockpit "promesse vs réalité".
- **Vrais témoignages** des premiers Founding Members (⚠️ remplacer les témoignages fictifs actuels — ils
  détruisent la confiance s'ils sont découverts).
- Garantie **"satisfait ou remboursé 14 jours"** (coût quasi nul vu la marge, lève le risque pour l'acheteur).

**Réponses prêtes aux 5 objections principales :**

| Objection | Réponse cadrée valeur |
|-----------|------------------------|
| *"Je trouve des idées gratuitement sur Reddit/X."* | "Exact, l'idée brute est gratuite partout. Ce que tu paies ici, c'est **le tri (qu'est-ce qui marche vraiment), l'adaptation FR, et le plan J1→J14** — les 20 heures de recherche que tu ne feras pas. À 29 €, si ça t'économise un week-end, c'est rentabilisé." |
| *"Encore un abonnement…"* | "Pas besoin d'abonnement : prends **une fiche à 29 €**, sans engagement. Tu t'abonnes seulement si tu veux tout le catalogue + le cockpit." |
| *"Pas de revenus, pas de budget."* | "Justement : l'erreur la plus chère, c'est lancer le mauvais produit. 29 €, c'est moins qu'une soirée, pour éviter de perdre 2 mois. Et il y a une **garantie 14 jours remboursé**." |
| *"Je ne fais pas confiance aux idées IA."* | "Les idées sont **détectées sur des SaaS qui tournent déjà à l'étranger**, pas inventées. On te montre les sources et les chiffres. Tu juges sur pièce, gratuitement, avec 3 idées offertes." |
| *"Le cockpit, pas besoin avant d'avoir lancé."* | "C'est vrai. Donc commence par **Builder à 19 €** pour le plan de build. Le cockpit t'attend le jour où tu auras ton premier euro de MRR — et là il devient ton tableau de bord." |

### 2.5 Leviers de conversion (du "intéressé" au "je paie")

- **Garantie 14 jours satisfait-ou-remboursé** : coût quasi nul (marge 97 %), supprime le risque perçu.
- **Offre de lancement limitée** (Founding Member 50 places) : urgence réelle, pas factice.
- **Essai Pro 7 jours avec CB** : convertit 5-10× mieux que le freemium.
- **Paiement annuel remisé** (-20 %) : encaisse 180-372 € d'un coup = cash + réduit le churn.
- **Preuve sociale** : compteur "X makers ont déjà rejoint", vrais témoignages, captures de résultats.
- **Tripwire 29 €** : transforme un curieux en acheteur ; un acheteur à 29 € est **bien plus facile**
  à convertir ensuite en abonné qu'un inscrit gratuit.

### 2.6 Tactiques originales (que les concurrents n'exploitent pas)

1. **"L'idée du dimanche" en public** : chaque semaine, tu publies gratuitement le *teaser* d'une fiche
   (le problème + le marché), et le *plan complet + prompt* est derrière l'à-la-carte 29 €. Le contenu
   gratuit fait la pub du payant, en boucle. (IdeaBrowser fait "idea of the day" mais **enferme tout
   derrière un abonnement annuel à 499 $** — toi tu vends à l'unité, friction zéro.)
2. **Encaisser AVANT d'avoir fini Stripe** : ouvre un Gumroad/Lemon Squeezy dès cette semaine pour
   vendre l'à-la-carte et le Founding Member. Tu valides la vente pendant que tu branches Stripe en parallèle.
3. **Double affiliation symétrique** : tu recommandes Qonto/Brevo/Pennylane (tu touches ~90 €/Qonto) ET
   tu offres une commission aux animateurs de communautés qui te recommandent. La marge 97 % finance les deux.
4. **"Build challenge" payant** : un cohort-light (cohorte) à prix réduit où 10-20 makers lancent la
   même fiche en 14 jours, partagent leur cockpit. Crée de la preuve sociale + des témoignages + du bouche-à-oreille.
5. **Garantie "promesse tenue"** : "si en suivant le plan tu n'as pas ta landing + 1ᵉʳ prospect en 14 jours,
   on te rembourse." Audacieux, mémorable, et la marge le permet.

### 2.7 Priorisation (effort/revenu & rapidité d'encaissement)

| Priorité | Action | Délai cash | Effort |
|----------|--------|-----------|--------|
| **1** | Ouvrir un Gumroad/Lemon Squeezy + vendre l'à-la-carte 29 € dans les communautés | **Jours** | Faible |
| **2** | Lancer l'offre Founding Member limitée (149 €/an, 50 places) | **Jours** | Faible |
| **3** | Brancher Stripe Checkout + essai Pro 7 j avec CB | 1-2 semaines | Moyen |
| **4** | Build-in-public hebdo (X/LinkedIn) + newsletter "idée de la semaine" | Continu | Moyen |
| **5** | Activer l'affiliation sortante (Qonto, Brevo, Pennylane) | 1-2 semaines | Faible |
| **6** | Partenariats communautés (revenue share / codes promo) | Semaines | Moyen |
| **7** | B2B perks incubateurs/écoles | Mois | Élevé |

> Bon sens d'opérateur : **fais les lignes 1 et 2 cette semaine.** Elles encaissent du cash réel avec
> presque rien, et te disent en quelques jours si le marché paie — bien avant d'avoir tout automatisé.

---

## 3. GUIDE D'EXÉCUTION (A à Z, débutant total en vente)

> Pensé pour quelqu'un qui n'a **jamais vendu**. On commence par **les premières ventes** (prouver
> que ça se vend), puis on monte en puissance. Suis-le comme une checklist.

### Vue d'ensemble (calendrier)

```
Semaine 1   ──► PREMIER EURO : vendre l'à-la-carte 29 € à la main (Gumroad/Lemon Squeezy)
Semaine 2   ──► CASH GROUPÉ : lancer Founding Member (149 €/an, 50 places) + Stripe en parallèle
Semaine 3-4 ──► MOTEUR : build-in-public + newsletter + essai Pro avec CB
Mois 2      ──► RÉCURRENCE : affiliation sortante + partenariats communautés
Mois 3+     ──► VOLUME : optimiser conversion, tester un peu de paid, ouvrir le B2B perks
```

---

### PHASE 1 — Tes 5 à 10 premières ventes (Semaine 1-2)

#### Étape 1.1 — Mettre en place un moyen d'encaisser en 1 journée

- **Quoi faire** : ouvrir un compte **Lemon Squeezy** (recommandé : il gère la TVA EU/française
  automatiquement, tu n'as rien à déclarer côté TVA) ou **Gumroad** (plus simple encore). Y créer 2 produits :
  l'**à-la-carte 29 €** et le **Founding Member 149 €**.
- **Comment précisément** :
  1. Crée le compte, ajoute ton IBAN pour être payé.
  2. Produit 1 : "Fiche SaaS Radar — guide complet J1→J14 + business plan + prompt IA" à 29 €.
  3. Produit 2 : "Founding Member — 1 an d'accès complet (places limitées)" à 149 €.
  4. Récupère les **liens de paiement** (tu peux les coller dans un DM, un post, la newsletter).
- **Pourquoi cet outil** : tu encaisses **aujourd'hui**, sans attendre que Stripe soit branché dans l'app.
- **Temps** : ~2-3 h. **Résultat attendu** : 2 liens cliquables qui prennent l'argent.

#### Étape 1.2 — Faire la liste de tes 30 premiers prospects

- **Quoi faire** : repérer 30 makers FR "prêts à lancer" dans les communautés.
- **Comment** : rejoins les Discord **IndieMakers.fr** et **IA.Builders**, et **SoloTryb**. Note
  (dans un simple tableur Google Sheets gratuit) les gens qui ont récemment posté "je cherche une idée",
  "je veux lancer un SaaS", "j'ai du temps ce mois-ci", "je vibe-code quoi ?". Colonnes : pseudo, lien,
  ce qu'ils ont dit, statut (à contacter / contacté / relancé / client).
- **Pourquoi** : un pipeline (= ta liste de ventes en cours) écrit, c'est 80 % du travail de vente.
- **Temps** : ~2 h. **Résultat** : 30 noms qualifiés dans un tableur.

#### Étape 1.3 — Contacter à la main (founder-led sales)

- **Quoi faire** : envoyer un message personnalisé (pas du copier-coller bête) à chacun.
- **Comment** : utilise le script ci-dessous, **adapté** à ce que la personne a dit. Règle d'or :
  on **aide d'abord, on vend ensuite**. Offre une vraie fiche gratuite aux 5 premiers contre un retour honnête.

> **Modèle — premier contact (DM communauté) :**
> "Salut [prénom] 👋 j'ai vu que tu cherchais quoi lancer comme micro-SaaS. Je bosse sur SaaS Radar :
> je détecte des micro-SaaS qui marchent déjà à l'étranger et je fais le plan complet pour les lancer
> en France (guide 14 jours + business plan + prompt IA). J'ai justement une fiche qui pourrait coller à
> ton profil [dire pourquoi]. Je te l'offre contre un retour honnête, ça t'intéresse ?"

- **Pourquoi** : offrir crée la réciprocité + te donne tes premiers témoignages.
- **Temps** : ~1 h pour 10 messages. **Résultat** : 3-5 conversations engagées, 1-3 premières ventes/retours.

#### Étape 1.4 — Lancer l'offre Founding Member (urgence réelle)

- **Quoi faire** : poster **une fois** dans chaque communauté (en respectant les règles d'autopromo, souvent
  un channel #vitrine/#projets) + sur X/LinkedIn, l'offre limitée.
- **Comment** : message ci-dessous + lien Lemon Squeezy.

> **Modèle — post Founding Member :**
> "🚀 SaaS Radar ouvre ses 50 places de Founding Members. Chaque semaine je te livre un micro-SaaS validé
> à lancer en France + le plan exact pour le construire en 14 jours, et un cockpit qui te dit si tu tiens
> ta promesse de croissance. Les 50 premiers ont **1 an complet à 149 €** (au lieu de 228 €) + accès direct
> à moi pour orienter le produit. Quand c'est plein, c'est plein 👉 [lien]"

- **Pourquoi** : encaisse du cash groupé immédiat + crée une base de fans qui parlent de toi.
- **Temps** : ~1 h. **Résultat** : premières ventes à 149 €, preuve que le marché paie.

---

### PHASE 2 — Le moteur de vente (Semaine 3 → Mois 2)

#### Étape 2.1 — Brancher Stripe + l'essai Pro

- **Quoi faire** : finaliser Stripe Checkout dans l'app (prix réels au lieu de `XX€`), activer l'**essai
  Pro 7 jours avec carte bancaire**.
- **Comment** : prix Builder 19/180, Pro 39/372 ; essai 7 j qui bascule en payant sauf annulation.
- **Pourquoi** : l'essai avec CB convertit à **25-35 %** vs 2-5 % en freemium → c'est ton plus gros
  multiplicateur de conversion.
- **Temps** : 1-2 semaines (dev). **Résultat** : tunnel self-serve qui tourne 24/7.

#### Étape 2.2 — Build-in-public hebdomadaire

- **Quoi faire** : chaque semaine, publier le *teaser* gratuit d'une fiche (problème + marché + 1 chiffre)
  et renvoyer vers l'à-la-carte/Builder pour le plan complet.
- **Comment** : 1 thread X + 1 post LinkedIn + 1 envoi newsletter, même contenu. Toujours finir par
  un appel clair : "Le plan complet J1→J14 est ici 👉 [lien]".
- **Pourquoi** : transforme ton contenu en machine à vendre, gratuitement et en continu.
- **Temps** : ~2 h/semaine. **Résultat** : flux régulier de ventes à-la-carte + inscriptions newsletter.

#### Étape 2.3 — Relancer (la plupart des ventes se font en relance)

- **Quoi faire** : recontacter ceux qui ont vu/cliqué sans acheter, et les essais Pro non convertis.
- **Comment** : relance courte, sans culpabiliser, qui apporte un élément nouveau.

> **Modèle — relance J+3 (pas de réponse) :**
> "Hello [prénom], je ne veux pas t'embêter 🙂 juste : la fiche dont je te parlais, je l'ai mise à jour
> avec les derniers chiffres du marché. Toujours partant pour que je te l'envoie ?"

> **Modèle — relance fin d'essai Pro (J+6) :**
> "Salut [prénom], ton essai Pro se termine demain. Tu as pu connecter Stripe/voir le cockpit ? Si tu veux,
> je te montre en 5 min comment lire ton écart promesse vs réalité avant que ça bascule. Sinon tu peux
> annuler en 1 clic, zéro souci."

- **Pourquoi** : 1 relance polie récupère une part importante des ventes "perdues".
- **Temps** : ~1 h/semaine. **Résultat** : +20-40 % de ventes sur le même volume de prospects.

#### Étape 2.4 — Activer l'affiliation sortante

- **Quoi faire** : t'inscrire aux programmes **Qonto** (~90 €/compte), **Brevo**, **Pennylane**, et placer
  tes liens dans les recommandations de stack du cockpit (Stack Health) + les fiches.
- **Comment** : candidature sur les pages affiliés (liens en Sources), récupérer les liens de tracking,
  les intégrer là où le produit recommande déjà ces outils.
- **Pourquoi** : revenu à marge ~100 % qui ne dépend pas de la vente de TON abonnement ; déjà aligné produit.
- **Temps** : ~3 h setup. **Résultat** : commissions passives dès que des fondateurs ouvrent un Qonto.

---

### PHASE 3 — Montée en puissance (Mois 3+)

- **Partenariats communautés** : proposer à 2-3 animateurs un **code promo + revenue share** (ex. -20 %
  pour leur audience, X € ou X % pour eux par vente). Modèle de message en section dédiée ci-dessous.
- **B2B perks incubateurs/écoles** : email direct aux program managers (Kedge, Ynov, KIVO, IP Paris) pour
  offrir un accès groupé à leurs incubés (souvent gratuit au début → visibilité, puis licence payante).
- **Paid d'appoint** : seulement une fois que tu connais ton taux de conversion et ton LTV ; commence
  petit (20-30 €/jour) sur le canal qui convertit déjà en organique.

---

### Fixer & négocier un prix (sans brader)

- **Annonce le prix avec assurance**, sans t'excuser : "C'est 29 € la fiche / 19 € par mois." Point. Silence.
- **Ancre toujours sur le concurrent US** : "IdeaBrowser c'est 499 $/an, annuel obligatoire. Moi c'est 19 €/mois,
  en français, sans engagement." Le prix paraît alors petit.
- **Si on te demande une remise** : ne baisse pas le prix, **change l'offre**. Propose plutôt :
  "Je ne peux pas baisser, mais je te mets la 1ʳᵉ fiche offerte si tu prends l'annuel" ou "je te garde le
  tarif Founding". Tu protèges la valeur perçue.
- **Jusqu'où céder** : remise max ~20 % (le rabais de l'annuel), et seulement contre un engagement (annuel)
  ou une contrepartie (témoignage, étude de cas, recommandation). Jamais de remise "sèche".
- **Alternative à la baisse** : descends en gamme (propose l'à-la-carte 29 € au lieu de l'abonnement) plutôt
  que de casser le prix de l'abonnement.

### Conclure (closing) — demander la vente clairement

- **Demande explicitement** : ne termine jamais une conversation par "n'hésite pas". Termine par une question
  fermée : "Je t'envoie le lien de paiement ?" ou "On part sur Builder ou tu préfères tester une fiche à 29 € d'abord ?"
- **Lève la dernière hésitation** avec la garantie : "Tu as 14 jours satisfait ou remboursé, tu ne prends
  aucun risque."
- **Facilite le paiement** : colle directement le lien Lemon Squeezy/Stripe dans la conversation. Moins il y a
  de clics, plus tu encaisses.

### Modèles prêts à l'emploi (copier-coller-adapter)

> **Proposition / récap après une démo :**
> "Merci pour l'échange [prénom] ! Pour résumer ce que SaaS Radar t'apporte : [bénéfice 1 lié à SON cas],
> [bénéfice 2]. Je te propose **Builder à 19 €/mois** (sans engagement, 14 j remboursé). Voici le lien 👉 [lien].
> Tu me dis si tu as la moindre question, je reste dispo."

> **Partenariat communauté (revenue share) :**
> "Salut [prénom], j'adore ce que tu as construit avec [communauté]. SaaS Radar aide tes membres à savoir
> QUOI lancer et à piloter leur SaaS. Je te propose un **code promo -20 % pour ta communauté**, et **X € reversés
> par abonnement** que tu ramènes. Zéro effort pour toi : tu partages, je gère le reste. Tu veux qu'on teste un mois ?"

> **B2B incubateur/école :**
> "Bonjour [prénom], je dirige SaaS Radar, un outil qui aide les fondateurs early-stage à identifier un micro-SaaS
> viable et à le construire/piloter. Beaucoup de vos incubés galèrent sur le 'quoi lancer' et le pilotage des
> premières métriques. Je serais ravi d'offrir un **accès groupé à votre promotion** (perk) et d'animer un atelier
> de 45 min. Auriez-vous 15 min cette semaine pour en parler ?"

> **Réponse "c'est trop cher" :**
> "Je comprends. La vraie question c'est : combien te coûte de lancer le mauvais produit ? Une fiche à 29 €
> t'évite des semaines perdues, et c'est remboursé sous 14 j si ça ne t'aide pas. Tu veux essayer juste une fiche ?"

### Indicateurs à suivre (pipeline & conversion)

Garde un tableur simple. 4 chiffres suffisent au début :

| Indicateur | Définition (vulgarisée) | Bon | À corriger |
|------------|--------------------------|-----|------------|
| **Ventes / semaine** | Nb de paiements encaissés (à-la-carte + abos) | En hausse semaine après semaine | Stagnant 3 sem. → revoir l'offre ou le canal |
| **Taux de conversion DM → vente** | % des prospects contactés qui achètent | > 10-15 % en founder-led | < 5 % → ton message ou ta cible ne colle pas |
| **Conversion essai Pro → payant** | % des essais CB qui restent | 25-35 % (benchmark) | < 15 % → onboarding/activation à revoir |
| **Inscrits newsletter / semaine** | Croissance du réservoir gratuit | En hausse régulière | Plat → ton contenu public ne circule pas |

> **Pipeline** = ta liste de ventes en cours, classée par étape (à contacter → en discussion → proposition
> envoyée → gagné/perdu). Le regarder chaque lundi te dit où agir cette semaine.

---

## Sources

- [IdeaBrowser — Pricing](https://www.ideabrowser.com/pricing) — vérifié 2026-05
- [1mil.app — comparatif IdeaBrowser](https://1mil.app/compare/ideabrowser-alternative/) — 2026
- [Starter Story — pricing](https://www.starterstory.com/how-to-find-1m-ideas) — 2026
- [Trends.vc — Trends Pro](https://access.trends.vc/?medium=email) — 2026
- [Artisan Strategies — SaaS Conversion Benchmarks 2026](https://www.artisangrowthstrategies.com/blog/saas-conversion-rate-benchmarks-2026-data-1200-companies)
- [SaaSFactor — Freemium vs Trial](https://www.saasfactor.co/blogs/freemium-vs-trial-models-in-saas-what-really-boosts-conversions)
- [Stackmatix — Freemium to paid conversion](https://www.stackmatix.com/blog/freemium-to-paid-conversion)
- [FindSkill.ai — IA pour entrepreneurs et solo-fondateurs (2026)](https://findskill.ai/fr/ia-pour-entrepreneurs/)
- [IA.Builders](https://ia.builders/) — communauté FR
- [SoloTryb](https://solotryb.com/) — communauté solopreneurs FR
- [ToolMage — No Code Founders](https://www.toolmage.com/fr/tool/no-code-founders/)
- [Qonto — Programme d'affiliation](https://qonto.com/fr/affiliate) / [The Affiliate Monkey — Qonto EU](https://theaffiliatemonkey.com/affiliate/qonto-eu-affiliate-program/)
- [Brevo — Programme d'affiliation](https://www.brevo.com/fr/partners/affiliates/)
- [Pennylane — Partenaires](https://www.pennylane.com/fr/partenaires)
- [Kedge Entrepreneurship — incubateur 2026 (perks)](https://entrepreneurship.kedge.edu/actualites/incubateur-paris-2026-startup)
