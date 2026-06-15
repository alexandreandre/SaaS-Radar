# Stratégie marketing — SaaS Radar

> Document de travail. Recommandations issues d'une analyse du 15 juin 2026,
> croisant l'état réel du produit (code + docs) et une recherche marché récente
> (sources citées en fin de document). À challenger avec les premières données
> réelles de trafic et de conversion.

---

## 1. ANALYSE

### 1.1 Le projet (ce qu'il est vraiment)

**En une phrase.** SaaS Radar détecte chaque semaine des micro-SaaS qui marchent
à l'étranger, juge s'ils peuvent marcher en France, donne le plan exact pour les
construire avec l'IA — puis un **cockpit de pilotage** ("Command Center") suit
l'écart entre la *promesse* de la fiche et la *réalité* du fondateur via 30
connecteurs (Stripe, Qonto, Google Ads…).

**Le problème résolu** (3 douleurs enchaînées du fondateur FR) :
1. *Quoi construire ?* → une idée validée plutôt qu'un pari.
2. *Comment la construire vite ?* → stack, MVP en 14 jours, prompt Claude Code.
3. *Est-ce que ça marche ?* → piloter MRR, acquisition, runway sans assembler 10
   dashboards.

**À qui ça s'adresse** (B2C "prosumer", marché francophone) :
- Indie hackers / makers FR qui savent coder ou "vibe-coder".
- Freelances tech / devs cherchant un revenu produit récurrent.
- Solopreneurs no-code / consultants voulant productiser.

**Stade de maturité.** MVP avancé côté produit, **pré-lancement côté business** :
prix non fixés (`XX€`), Stripe non branché, cockpit en `localStorage`, 30
connecteurs en **mode démo** (données simulées, pas d'API réelle). Le moteur de
contenu (sourcing IA Perplexity → Gemini → Supabase) tourne déjà.

**Différenciateur réel (le seul vraiment défendable).** Le cockpit connaît la
*promesse éditoriale* de chaque fiche (scénarios financiers, stack, canaux
d'acquisition) et mesure l'**écart promesse vs réalité**. Personne ne relie
idée → build → pilotage de cette façon. C'est le coeur du message marketing.

**Modèle économique visé.** Freemium SaaS (Free / Builder 19€ / Pro 39€) +
à-la-carte 29€/fiche + revenu d'affiliation sur les connecteurs (Qonto,
Pennylane, Brevo). Coût marginal quasi nul → marge ~90-95 %.

### 1.2 Le marché (recherche récente, sources citées)

> Tous les chiffres ci-dessous viennent de sources datées listées en §Sources.
> Les termes marketing sont expliqués au fil de l'eau.

**Un vent porteur très fort : le "vibe coding".** Décrire son app en langage
naturel et laisser l'IA générer le code est passé de niche à tendance de masse :
marché estimé à **4,7 Md$ en 2026** (CAGR ~38 %, projeté à 30 Md$ en 2032), et
**~41 % du code mondial serait généré par IA**. Cursor a dépassé **2 Md$ de
revenus annualisés** début 2026, Lovable affiche **400 M$ d'ARR** et 200 000
nouveaux projets/jour. (ia42.fr, polarastudio.fr) → *Conséquence : la population
de gens capables de lancer un SaaS seuls explose. C'est exactement la cible de
SaaS Radar, et le produit fournit déjà des prompts Claude Code / Cursor.*

**Un risque de cette vague = une opportunité pour SaaS Radar.** ~45 % du code
généré par IA contient des vulnérabilités, et les juniors introduisent 2,3× plus
de bugs en prod. (ia42.fr, formation-en-ia.fr) → *Le marché se remplit de gens
qui savent "faire sortir" un produit mais pas le piloter. Le cockpit "promesse
vs réalité" répond pile à ce manque.*

**Le marché FR des makers est réel mais éclaté, sans leader outil.** Pas de
recensement officiel, mais des communautés structurées : **Make Time** (2 000+
solo builders, se présente "#1 francophone Micro-SaaS & Vibe Coding"),
**Indiemakers.fr** (la communauté Discord de référence), **Micro Saas Buildr**
(260 membres, no-code, +1 300 formés), **Le Colisée** (2 139 membres Discord
SaaS/agences). Toile de fond : **3,18 M d'auto-entrepreneurs** en France, en
hausse de +204 000/an. (maketime.fr, findskill.ai, micro-saas.co, discord.do,
urssaf.org)

**Le modèle "indie portfolio" est validé et très FR-compatible.** Marc Lou
(Français) a bâti **~80 000 $/mois** avec un portefeuille de produits (ShipFast,
CodeFast, DataFast, TrustMRR) servant **la même audience** (devs indie), tous
distribués par son **build in public** sur X. Insight clé pour nous : *son
audience EST son client.* (indieai.directory, kodiq.ai, axelschapmann.substack)

**La nouvelle vague concurrentielle = "validation par la donnée réelle".**
BigIdeasDB agrège **148 000+ plaintes** Reddit/G2/Capterra pour scorer la demande ;
TrustMRR tracke le revenu vérifié de 2 700+ startups ; IdeaBrowser score les
idées sur un "Launch Readiness Score" 0-100. (bigideasdb.com, ideabrowser.com)
→ *Les "scores éditoriaux" seuls ne suffisent plus à se différencier ; il faut
de la preuve. Le cockpit (données réelles du fondateur) est notre preuve.*

**La douleur n°1 de la cible est documentée et brutale.** Le récit dominant chez
les indie hackers en 2026 : *"j'ai codé 3 mois un truc que personne ne voulait
payer"*. La méthode qui marche : tuer ses idées vite via les plaintes Reddit
(`site:reddit.com [niche]`, recherches "sucks", "I'd pay for"), 50+ mentions de
la même douleur, puis landing + pré-vente avant de coder. (Indie Hackers,
fromscratch.dev, miner.ethanbase.com) → *SaaS Radar vend exactement ça :
"ne code pas dans le vide".*

### 1.3 Synthèse & insights non évidents

1. **L'audience = le client.** Contrairement à 90 % des SaaS, ici les gens qui
   consomment du contenu "comment lancer un SaaS" SONT les acheteurs. Le build
   in public et le founder-led content (publier sous son nom) ne sont donc pas
   un "canal parmi d'autres" : c'est *le* canal naturel, prouvé par Marc Lou.
   (foundertrace.substack, swanbase.co)
2. **Le vrai produit n'est pas l'annuaire d'idées — c'est le cockpit.** L'annuaire
   est saturé (IdeaBrowser, Make Time, BigIdeasDB…) et churne par nature. Le
   cockpit "promesse vs réalité" est l'angle vacant que personne n'occupe. Le
   marketing doit vendre le *pilotage*, pas la *liste d'idées*.
3. **Le marché FR est orphelin d'un outil.** Make Time est une newsletter/média,
   Indiemakers un Discord, Micro Saas Buildr une formation no-code. Aucun n'est
   un *outil de pilotage idée→revenu*. Place à prendre.
4. **Fatigue de l'abonnement.** Marc Lou a vu ses conversions exploser en passant
   au paiement unique ("vendre un abo 10€/mois est aussi dur qu'un one-shot
   100€"). → L'offre **à-la-carte 29€/fiche** n'est pas un détail : c'est
   peut-être la meilleure porte d'entrée pour convertir, avant l'abonnement.
   (blog.startupstash.com)
5. **Le SEO programmatique est un cadeau structurel.** Chaque fiche opportunité
   est une page riche en data propriétaire. Zapier/Canva ont bâti leur dominance
   là-dessus. C'est notre canal d'acquisition long terme à coût quasi nul.
   (nicolasdayez.fr)

### 1.4 Hypothèses / questions ouvertes (à trancher)

Je propose des réponses par défaut dans la stratégie, mais 3 décisions
m'aideraient à affiner le guide d'exécution : voir les questions en fin de
réponse (budget pub, temps hebdo dispo, présence personnelle d'un fondateur).

---

## 2. STRATEGIE

### 2.1 Positionnement & angle unique

**Le piège à éviter.** Se positionner comme "une base d'idées de SaaS". C'est
saturé (IdeaBrowser, Make Time, BigIdeasDB), perçu comme commodité, et ça churne
(on cherche une idée une seule fois).

**Le positionnement choisi.** SaaS Radar = **le copilote qui t'accompagne de
l'idée jusqu'au MRR**, et surtout **le seul à te dire si la réalité tient la
promesse**. On ne vend pas une liste, on vend un *parcours piloté* et une
*vérité chiffrée*.

> **Phrase de positionnement interne :** *"Les autres te donnent une idée. SaaS
> Radar te dit quoi construire, comment le construire avec l'IA, et si ça marche
> vraiment — chiffres à l'appui."*

**Pourquoi cet angle ICI.** L'analyse montre (a) un afflux massif de "vibe
coders" capables de produire mais incapables de piloter, (b) une concurrence qui
s'arrête à l'idée, (c) un cockpit "promesse vs réalité" techniquement unique.
L'angle découle directement du marché, il n'est pas plaqué.

### 2.2 Proposition de valeur (orientée bénéfice)

- **Accroche principale :** *"Arrête de coder dans le vide. Trouve un SaaS qui
  marche déjà, construis-le avec l'IA en 14 jours, et pilote-le jusqu'au premier
  client — au même endroit."*
- **Sous-accroche preuve :** *"Le seul cockpit qui compare ta promesse de départ
  à tes vrais chiffres (Stripe, Qonto, Google Ads)."*

### 2.3 Personas prioritaires

> *Persona = portrait-robot d'un client type, pour écrire à une personne réelle
> plutôt qu'à une foule floue.*

**Persona 1 — "Yanis, le dev qui veut sortir du salariat" (coeur de cible).**
28 ans, développeur en CDI, utilise déjà Cursor au quotidien. Douleur :
*"Je sais coder, mais à chaque side-project je passe 3 mois sur une idée que
personne ne paie."* Déclencheur d'achat : voir une fiche avec un score, des
chiffres réels d'un SaaS étranger et un prompt Claude Code prêt. Objection :
*"Je peux trouver des idées gratuitement sur Reddit/X."* → Réponse : le gain de
temps + le pilotage, pas l'idée brute.

**Persona 2 — "Camille, la freelance no-code/marketing qui veut du récurrent."**
34 ans, consultante, construit avec Bubble/Lovable. Douleur : *"J'ai des clients
mais zéro revenu passif, et je ne sais pas quelle idée a un vrai marché en
France."* Déclencheur : l'adaptation FR (RGPD, canaux FR, compta FR) + simulateur
MRR. Objection : *"C'est trop technique pour moi."* → Réponse : guides pas-à-pas
+ cockpit en saisie manuelle (pas besoin d'API).

**Persona 3 — "Thomas, le maker en série déjà lancé."** 31 ans, a déjà 1-2
petits SaaS, traîne sur Indiemakers et X. Douleur : *"Mes dashboards sont
éparpillés, je ne sais pas si je tiens mes objectifs."* Déclencheur : le cockpit
multi-projets + connecteurs. C'est le persona qui justifie le plan **Pro** et la
**rétention** (donc la valeur long terme). Objection : *"J'ai déjà Baremetrics."*
→ Réponse : promesse vs réalité + connecteurs FR (Qonto/Pennylane) qu'ils n'ont
pas.

### 2.4 Canaux retenus (justifiés) & canaux écartés (pourquoi)

**Règle d'or marché (fromscratch.dev) :** *choisir 1 canal, le travailler à fond
jusqu'à 50-100 utilisateurs, PUIS en ajouter un second.* Surtout pas les 5 en
même temps. Pas de pub payante tant que le tunnel ne convertit pas.

**RETENUS (par ordre de priorité) :**

| # | Canal | Pourquoi ICI (preuve) | Effort | Impact |
|---|-------|----------------------|--------|--------|
| 1 | **Founder-led content + Build in public (X + LinkedIn)** | Ici l'audience = le client (Marc Lou le prouve à 80k$/mois). Canal organique le plus efficace pour B2B early-stage 2026. | Moyen (régularité) | **Très élevé** |
| 2 | **Communautés de niche FR (Indiemakers, Make Time, Le Colisée, Micro Saas Buildr, r/SaaS, r/entrepreneur)** | C'est *exactement* là que sont les 3 personas. Le canal le plus rapide pour les 100 premiers. | Faible-moyen | **Élevé** |
| 3 | **SEO programmatique sur les fiches opportunités** | Data propriétaire = pages que les concurrents ne peuvent pas copier (modèle Zapier/Canva). Canal lent mais composé, CAC quasi nul. | Élevé au départ | **Élevé (long terme)** |
| 4 | **Newsletter hebdo (déjà dans le produit)** | Le "pick de la semaine" est un lead magnet naturel (raison de revenir chaque semaine). Transforme l'audience en actif possédé. | Faible | **Élevé** |
| 5 | **Lancements répertoires (BetaList → Product Hunt → Indie Hackers / Uneed)** | Pics de visibilité + backlinks SEO (dofollow). Séquence éprouvée. | Moyen (ponctuel) | Moyen |

**ÉCARTÉS (pour l'instant) :**

- **Pub payante (Google/Meta/LinkedIn Ads).** À éviter avant d'avoir un tunnel
  qui convertit et des prix fixés. CAC LinkedIn FR très cher (300-500 €/lead).
  *Ironie utile : le produit a un module Acquisition — autant prouver d'abord
  l'organique avant de dépenser.* (overloop.com)
- **TikTok / Instagram.** La cible (devs/makers) n'y consomme pas de contenu
  "lancer un SaaS". Hors-sujet pour le coeur de cible.
- **Cold email B2B de masse.** Pertinent plus tard pour l'offre B2B (incubateurs,
  écoles), pas pour le coeur B2C maintenant.

### 2.5 Messages clés (par persona / canal)

- **Pour Yanis (X, dev) :** *"T'as Cursor. Il te manque quoi à construire ?
  Une idée qui a déjà des clients ailleurs. SaaS Radar t'en sort une par semaine,
  avec le prompt Claude prêt."*
- **Pour Camille (LinkedIn, no-code) :** *"Lancer un SaaS rentable sans être
  ingénieure : l'idée validée + le plan FR + le tableau de bord, en français."*
- **Pour Thomas (Indiemakers/Pro) :** *"Tes chiffres sont éparpillés ? Branche
  Stripe + Qonto et vois en 1 écran si tu tiens ta promesse de MRR."*
- **Message transverse (anti-douleur) :** *"90 % des side-projects meurent parce
  qu'on code avant de valider. Inverse l'ordre."*

### 2.6 Idées créatives originales (ce que les concurrents ne font pas)

1. **Le "Reality Report" public mensuel.** Publier en build in public les
   chiffres réels (anonymisés/agrégés) des fondateurs qui pilotent leur SaaS via
   le cockpit : "ce mois-ci, les 40 SaaS suivis ont fait X€ de MRR, voici les 3
   idées qui décollent". Personne n'a cette donnée → contenu unique + preuve
   vivante du cockpit + machine à backlinks.
2. **Le "Promesse vs Réalité" en format viral.** Carte de partage (déjà dans le
   produit, module Rapports) où un fondateur poste "Radar promettait 2 400€,
   j'en suis à 1 850€ au mois 4". Honnêteté = aimant à indie hackers (cf. Pierre
   de Marketing Flow, 17 000 abonnés bâtis sur la transparence).
3. **Challenge "0 → premier client en public" avec un cohorte.** Un batch de
   makers lance la même semaine, suivi dans le cockpit, raconté chaque vendredi.
   Crée du bouche-à-oreille et de l'UGC (contenu créé par les utilisateurs).
4. **Free tool "entry drug" (modèle LogoFast de Marc Lou).** Sortir un mini-outil
   gratuit ultra-partageable (ex : "Score ton idée de SaaS en 60s" — un bout du
   moteur de scoring exposé sans login) qui capture des emails et amène vers le
   produit complet.
5. **Partenariats créateurs vibe coding FR.** Make Time, Q-SEO, créateurs Cursor/
   Claude FR : échange de visibilité / affiliation. Leur audience est notre
   cible exacte.

### 2.7 Priorisation (impact vs effort)

**À faire MAINTENANT (fort impact, effort raisonnable) :**
- Fixer les prix + brancher Stripe (sinon rien n'est vendable).
- Lancer le founder-led content (canal #1) + être actif dans 2-3 communautés FR.
- Activer la newsletter "pick de la semaine" comme top of funnel.
- Sortir le free tool "Score ton idée en 60s".

**PLUS TARD (fort impact, gros effort ou prérequis) :**
- SEO programmatique à grande échelle (quand le tunnel convertit).
- Reality Report mensuel (quand assez de projets cockpit actifs).
- Lancements Product Hunt (quand le produit paie et que la landing convertit).

**OPTIONNEL / À TESTER :**
- Pub payante d'appoint (uniquement après preuve d'un tunnel rentable).
- Offre B2B (incubateurs/écoles) — An 2+.

---

## 3. GUIDE D'EXECUTION (A à Z, pour débutant total en marketing)

> Pensé pour quelqu'un qui n'a jamais "fait de marketing". Chaque étape précise :
> **quoi faire / comment / combien de temps / résultat attendu.** Objectif des 90
> premiers jours : **5 000 inscrits newsletter + 50 premiers payants**.

### Vue d'ensemble (calendrier)

| Phase | Semaines | Objectif | Métrique cible |
|-------|----------|----------|----------------|
| **Phase 0 — Fondations** | S1-S2 | Rendre le produit vendable + prêt à mesurer | Stripe live, analytics posé |
| **Phase 1 — Voix & présence** | S2-S6 | Lancer le founder-led content + communautés | 100 premiers inscrits, 1ers retours |
| **Phase 2 — Traction** | S6-S10 | Lancements + free tool + newsletter | 1 000 inscrits, 1ers payants |
| **Phase 3 — Moteur durable** | S10+ | SEO programmatique + Reality Report | 5 000 inscrits, 50 payants |

---

### Phase 0 — Fondations (Semaines 1-2)

**Étape 0.1 — Fixer les prix et brancher le paiement.**
- *Quoi :* remplacer les `XX€` par Builder 19€/mois, Pro 39€/mois, à-la-carte
  29€/fiche (hypothèses du business plan), et brancher l'encaissement.
- *Comment :* créer un compte **Stripe** (gratuit, paiement à la commission ~1,5 %
  + 0,25€), brancher Stripe Checkout sur les pages `/checkout/*`. Mettre en avant
  l'option **à-la-carte 29€** comme porte d'entrée (anti-fatigue d'abonnement).
- *Temps :* 1-2 jours (dev).
- *Résultat :* on peut encaisser un premier euro.

**Étape 0.2 — Poser la mesure (savoir ce qui marche).**
- *Quoi :* installer un outil d'analytics respectueux du RGPD pour suivre visites,
  inscriptions, achats.
- *Comment :* **Plausible** (~9€/mois, simple, RGPD, pas de bandeau cookies) ou
  **PostHog** (généreux gratuit, funnels). Définir 3 événements : `inscription
  newsletter`, `compte créé`, `achat`.
- *Temps :* 2-3 heures.
- *Résultat :* tu vois ton "taux de conversion" (= % de visiteurs qui passent à
  l'action) à chaque étape.

**Étape 0.3 — Préparer la capture d'emails.**
- *Quoi :* faire de la newsletter le filet qui récupère tout le trafic.
- *Comment :* **Brevo** (gratuit jusqu'à 300 envois/jour, FR, RGPD) ou
  **Resend/Loops**. Formulaire visible sur la home + chaque fiche.
- *Temps :* 2-3 heures.
- *Résultat :* chaque visiteur intéressé devient un contact possédé.

---

### Phase 1 — Voix & présence (Semaines 2-6)

**Étape 1.1 — Choisir LA personne qui parle (founder-led content).**
- *Quoi :* un fondateur publie sous son vrai nom (pas "SaaS Radar Inc."). Les
  humains achètent à des humains. (swanbase.co)
- *Comment :* choisir **X** (coeur indie/vibe coding, audience devs) **OU**
  **LinkedIn** (no-code/business FR). Si une seule personne : commencer par celle
  où le persona prioritaire est. Compléter avec l'autre plus tard.
- *Temps :* décision = 1h. Mise en place profil = 1h.
- *Résultat :* un canal de distribution personnel qui composera sur 12 mois.

**Étape 1.2 — Publier 3×/semaine, 7 formats qui tournent.**
- *Quoi :* du contenu utile + transparent, pas de la pub.
- *Comment (formats à alterner) :*
  1. *La fiche de la semaine* : "Ce SaaS fait 12k$/mois aux US. Voici s'il
     marcherait en France." (extrait gratuit d'une fiche)
  2. *Le contre-pied douleur* : "J'ai vu 50 makers coder 3 mois pour 0 client.
     Voici l'ordre inverse."
  3. *Coulisses build in public* : "Cette semaine j'ai branché Stripe, voici les
     chiffres."
  4. *Mini-étude* : "3 idées de SaaS qui montent en FR ce mois-ci."
  5. *Promesse vs réalité* : screenshot du cockpit.
  6. *Question à la communauté* : "Tu coderais quoi avec Cursor ce week-end ?"
  7. *Win d'un utilisateur* : relayer un premier client d'un membre.
- *Temps :* ~3-4h/semaine (batch le dimanche).
- *Résultat :* +50 à +200 abonnés/mois au début, 1ers DM intéressés.
- *Modèle de post fourni plus bas.*

**Étape 1.3 — S'implanter dans 2-3 communautés FR (sans spammer).**
- *Quoi :* aider d'abord, mentionner le produit seulement quand c'est pertinent.
- *Comment :* rejoindre **Indiemakers.fr** (Discord), **Make Time**, **Le Colisée**,
  **Micro Saas Buildr**, et **r/SaaS / r/entrepreneur**. Règle : 90 % d'aide
  utile, 10 % de promo. Répondre aux "je cherche une idée" / "comment valider".
- *Temps :* 20-30 min/jour.
- *Résultat :* premiers utilisateurs qualifiés + crédibilité.
- *Plan B :* si une communauté est trop fermée/promo-allergique, se rabattre sur
  Reddit (`r/SaaS`) où le partage utile est toléré.

---

### Phase 2 — Traction (Semaines 6-10)

**Étape 2.1 — Sortir le free tool "Score ton idée en 60s".**
- *Quoi :* un mini-outil gratuit, sans login, qui donne un score à une idée de
  SaaS (sous-ensemble du moteur de scoring). C'est l'"entry drug" (modèle
  LogoFast de Marc Lou). (blog.startupstash.com)
- *Comment :* page dédiée, résultat partageable (image), capture d'email pour
  "recevoir l'analyse complète". Le partager dans les communautés + en post.
- *Temps :* 3-5 jours (dev) + promo.
- *Résultat :* pic d'inscriptions + viralité ("regarde mon score").

**Étape 2.2 — Activer la newsletter "Pick de la semaine".**
- *Quoi :* 1 email/semaine = 1 opportunité décortiquée + 2 brèves. La raison de
  revenir chaque semaine.
- *Comment :* envoi via Brevo le même jour (ex. mardi 8h). CTA vers la fiche
  complète (gating Builder).
- *Temps :* 1-2h/semaine (le contenu existe déjà via le sourcing).
- *Résultat :* ouverture cible 35-45 %, clics 5-10 %, churn list faible.

**Étape 2.3 — Séquence de lancement répertoires.**
- *Quoi :* enchaîner les plateformes pour des pics + backlinks SEO.
- *Comment (séquence éprouvée) :* **BetaList** (4 semaines avant, collecte
  waitlist 20-150) → **Product Hunt** (jour J, préparer 2-3 semaines avant :
  visuels, 1ère vague de supporters) → **Hacker News / Indie Hackers** (J+1) →
  **Uneed + AlternativeTo** (backlinks). (iq-project.ai, poindeo.com)
- *Temps :* préparation ~2-3 semaines en parallèle, jour J intense.
- *Résultat :* 100-500 visiteurs qualifiés sur le pic + autorité SEO.
- *Plan B :* si le lancement PH retombe vite (plateforme saturée), capitaliser
  sur les communautés et le contenu, pas sur le buzz.

---

### Phase 3 — Moteur durable (Semaine 10+)

**Étape 3.1 — SEO programmatique sur les fiches.**
- *Quoi :* faire de chaque fiche/comparatif une page qui se classe sur Google.
- *Comment :* viser l'**intention d'achat** ("alternative à [outil]", "idée SaaS
  [niche] France", "comment lancer [type] SaaS"). Structurer avec Schema.org +
  `llms.txt` pour être cité par ChatGPT/Perplexity (GEO = Generative Engine
  Optimization). Mesurer le MRR généré, pas le trafic brut. (nicolasdayez.fr)
- *Temps :* mise en place template ~1 semaine, puis continu.
- *Résultat :* trafic organique composé, CAC tendant vers 0 sur 6-12 mois.

**Étape 3.2 — Reality Report mensuel (preuve + contenu unique).**
- *Quoi :* publier l'agrégat anonymisé des SaaS pilotés via le cockpit.
- *Comment :* 1 post long + 1 visuel/mois ("les 40 SaaS suivis ce mois : X€ MRR,
  top 3 idées"). Reprendre dans la newsletter + X/LinkedIn.
- *Temps :* 2-3h/mois.
- *Résultat :* contenu que personne ne peut copier + preuve vivante du cockpit.

**Étape 3.3 — Boucle d'affiliation connecteurs.**
- *Quoi :* monétiser les recommandations stack (Qonto ~80-100€/compte, Pennylane,
  Brevo).
- *Comment :* liens d'affiliation dans Stack Health + contenu "stack du fondateur
  FR". À marge ~100 %.
- *Temps :* 1 jour setup.
- *Résultat :* +10-25 % de revenu au-dessus de l'abonnement.

---

### Modèles de contenu prêts à l'emploi

**Post X "fiche de la semaine" :**
```
Ce SaaS fait 11 000 $/mois aux US.

En France ? Quasi personne dessus.

J'ai analysé :
- la demande FR
- le coût d'acquisition réaliste
- la stack pour le coder en 14 jours (prompt Cursor inclus)

Score Radar : 82/100.

Le détail 👇 [lien]
```

**Post LinkedIn "anti-douleur" (Camille) :**
```
90 % des side-projects meurent pour UNE raison :

on code 3 mois… avant de vérifier que quelqu'un paierait.

L'ordre qui marche en 2026 :
1. Partir d'un SaaS qui marche déjà ailleurs
2. Vérifier la demande FR (RGPD, canaux, prix)
3. SEULEMENT là, coder le MVP avec l'IA

C'est exactement le chemin qu'on outille avec SaaS Radar.
Tu en es où, toi : idée ou déjà en train de coder ?
```

**Email newsletter (structure) :**
```
Objet : 🛰️ Le SaaS de la semaine : [Nom] (score 82/100)

Salut [prénom],

Cette semaine, un SaaS qui cartonne aux US et qui est quasi vide en France : [Nom].

→ Ce qu'il fait : [1 phrase]
→ Pourquoi ça peut marcher en FR : [2 lignes]
→ Le piège à éviter : [1 ligne]

Fiche complète (plan 14 jours + prompt Claude) : [lien]

À mardi prochain,
[Prénom]

PS : tu pilotes déjà un SaaS ? Branche Stripe au cockpit et vois si tu tiens ta promesse de MRR : [lien]
```

**Message communauté (réponse à "je cherche une idée") :**
```
Le plus dur c'est pas l'idée, c'est de valider qu'on paierait.
Méthode rapide : cherche `site:reddit.com [ta niche]` + "sucks" / "I'd pay for",
vise 50 mentions de la même douleur avant de coder.
(Si tu veux des idées déjà scorées sur ce critère, je bosse sur SaaS Radar,
mais la méthode marche sans nous aussi.)
```

---

### Indicateurs de succès à suivre (simples)

| Métrique | Ce que ça veut dire | "Bon" | "À corriger" |
|----------|---------------------|-------|--------------|
| Inscrits newsletter | Top of funnel (haut de l'entonnoir) | +500/mois en croissance | Stagne 2 mois |
| Taux d'ouverture newsletter | % qui ouvrent l'email | > 35 % | < 25 % |
| Conversion Free → Payant | % d'inscrits qui paient | ≥ 3 % | < 1,5 % |
| Abonnés founder (X/LinkedIn) | Force du canal #1 | +100-200/mois | < 30/mois |
| Visiteurs → inscription | Efficacité de la landing | > 5 % | < 2 % |
| Churn mensuel payant | % qui se désabonnent | < 6 % | > 8 % |

Règle de pilotage : **un seul canal travaillé à fond > cinq canaux bâclés.** On
n'ajoute un canal qu'une fois le précédent à 50-100 utilisateurs.

---

## Sources

- [ia42.fr — Vibe Coding 2026 : guide complet](https://www.ia42.fr/vibe-coding-guide-complet) — 2026 (marché vibe coding 4,7 Md$, 41 % code IA, Cursor/Lovable/Replit, 45 % de vulnérabilités)
- [polarastudio.fr — Coder un SaaS avec l'IA en 2026](https://www.polarastudio.fr/blog/vibe-coding-coder-saas-ia-2026) — 2026 (Cursor 2 Md$ ARR, 46 % code IA)
- [formation-en-ia.fr — Vibe coding, mode d'emploi 2026](https://formation-en-ia.fr/vibe-coding-cest-quoi-comment-debuter-2026/) — 2026 (seniors +35 %, juniors 2,3× bugs)
- [maketime.fr — Make Time (2 000+ solo builders, #1 FR micro-SaaS)](https://www.maketime.fr/) — 2026
- [findskill.ai — IA pour entrepreneurs et solo-fondateurs 2026](https://findskill.ai/fr/ia-pour-entrepreneurs/) — 2026 (Indiemakers.fr, Station F, communautés FR)
- [micro-saas.co — Micro Saas Buildr (260 membres no-code)](https://www.micro-saas.co/) — 2026
- [discord.do — Le Colisée (2 139 membres)](https://discord.do/fr/le-colisee/) — 2026
- [urssaf.org — Auto-entrepreneurs (3,18 M actifs)](https://www.urssaf.org/accueil/statistiques/nos-etudes-et-analyses/travailleurs-independants/nationale/2026/auto-entrepreneurs-Janv2026.html) — 2026
- [ideabrowser.com/pricing — IdeaBrowser (499-2 999 $/an, Launch Readiness Score)](https://www.ideabrowser.com/pricing) — 2026
- [indieai.directory — Marc Lou playbook, 81 683 $/mois fév. 2026](https://indieai.directory/blog/marc-lou-81683-february-2026-income-breakdown/) — 2026
- [kodiq.ai — Marc Lou & Danny Postma, modèle portfolio](https://kodiq.ai/blog/ai-news-2026-05-20-marc-lou-danny-postma-solo-founder-portfolio-approach) — 2026
- [axelschapmann.substack.com — Marc Lou de 0 à 60k$/mois](https://axelschapmann.substack.com/p/marc-lou-de-0-a-60-000-mois-en-2) — 2026
- [blog.startupstash.com — Marc Lou playbook (free tool entry drug, fatigue d'abonnement)](https://blog.startupstash.com/the-marc-lou-playbook-15-ship-fast-truths-for-the-modern-solopreneur-075ed612a4d7) — 2026
- [Indie Hackers — Le coût de coder avant de valider](https://www.indiehackers.com/post/the-3-000-mistake-i-made-by-falling-in-love-with-my-own-code-2b8d4d6106) — mars 2026
- [fromscratch.dev — Trouver une niche SaaS rentable](https://fromscratch.dev/fr/blog/comment-trouver-niche-rentable-saas) — 2026
- [fromscratch.dev — Obtenir ses 100 premiers utilisateurs](https://fromscratch.dev/fr/blog/comment-obtenir-premiers-utilisateurs) — 2026
- [bigideasdb.com — Framework de validation 8 étapes (148k plaintes)](https://bigideasdb.com/startup-idea-validation-framework-8-stages) — 2026
- [foundertrace.substack.com — Cas Q-SEO : "build in public marche si audience = client"](https://foundertrace.substack.com/p/248k-abonnes-et-un-saas-lance-en) — 2026
- [swanbase.co — Founder-led content 2026](https://swanbase.co/blog/founder-led-content-strategie/) — 2026
- [conseilsmarketing.com — Build in public](https://www.conseilsmarketing.com/growth-hacking/build-in-public-la-strategie-pour-creer-une-communaute-de-fans-autour-de-ton-produit/) — 2026
- [iq-project.ai — Product Hunt guide complet 2026 (séquence BetaList→PH)](https://iq-project.ai/blog/product-hunt-guide-complet-lancement-strategie-2026/) — 2026
- [poindeo.com — Alternatives à Product Hunt 2026](https://poindeo.com/blog/product-hunt-alternatives) — 2026
- [overloop.com — Génération de leads SaaS B2B FR 2026 (CAC LinkedIn)](https://overloop.com/fr/blog/strategies-generation-leads-saas) — 2026
- [nicolasdayez.fr — SEO SaaS programmatique + GEO](https://nicolasdayez.fr/seo-saas-20-solutions-actionnables-pour-dominer-google-et-booster-votre-mrr/) — 2026
- [hostinger.com — Statistiques SaaS 2026 (marges micro-SaaS, churn)](https://www.hostinger.com/fr/tutoriels/statistiques-saas) — 2026
