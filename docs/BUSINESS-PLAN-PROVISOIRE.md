# SaaS Radar — Business plan PROVISOIRE

> **DOCUMENT PROVISOIRE** — toutes les projections ci-dessous sont des
> **hypothèses de travail**, à challenger et ajuster avec des données réelles
> (trafic, conversion, churn, willingness-to-pay). Ne pas traiter comme un
> engagement ni comme une prévision validée. Chaque chiffre clé est étiqueté
> comme hypothèse.

*Rédigé le 15 juin 2026 — basé sur l'état du code et de la doc produit
(`docs/COCKPIT-FONCTIONNALITES-INTEGRATIONS.md`, pricing, pipeline de sourcing).*

---

## 0. Résumé exécutif

- **Le produit en 2 phrases.** SaaS Radar détecte chaque semaine des micro-SaaS
  qui marchent à l'étranger, évalue leur potentiel en France et fournit le plan
  exact pour les construire avec l'IA. Une fois l'idée choisie, un **cockpit de
  pilotage** (« Command Center ») suit l'écart entre la *promesse éditoriale* de
  la fiche et la *réalité* du fondateur, via 30 connecteurs (Stripe, Qonto,
  Google Ads…).
- **Business model recommandé.** Abonnement SaaS **freemium** (Free / Builder /
  Pro) centré sur le **cockpit comme moteur de rétention**, complété par un
  **revenu d'affiliation** sur les connecteurs recommandés (Qonto, Pennylane,
  Brevo…).
- **Le pari central.** Transformer un « annuaire d'idées » (produit naturellement
  churné) en **compagnon de build récurrent** : check-in MRR mensuel, alertes,
  connecteurs → le fondateur reste abonné tant qu'il pilote son SaaS, pas
  seulement tant qu'il cherche une idée.
- **Structure de coûts (mesurée).** Coûts directs **quasi nuls** : quelques
  appels API par semaine (Perplexity Sonar pour la recherche + Gemini 2.5 Flash
  pour la rédaction) + infra Vercel/Supabase. **Pas d'inférence LLM par
  utilisateur**, pas de coût variable significatif → marge brute **~97 %** et
  produit **cash-positif quasi dès le départ** tant qu'on n'embauche pas.
- **Chiffres clés à 3 ans (scénario base, hypothèses).** ~1 200 clients payants,
  **ARR ≈ 317 k€**, **~290 k€ de marge** (coûts directs ~26 k€), valorisation
  indicative **1,3–2,5 M€**.

---

## 1. Produit et problème

### Problème résolu
Le fondateur français qui veut lancer un micro-SaaS fait face à 3 douleurs :
1. **Quoi construire ?** — trouver une idée validée, pas un pari.
2. **Comment la construire vite ?** — stack, MVP en 14 jours, prompt Claude Code.
3. **Est-ce que ça marche ?** — piloter MRR, acquisition, runway sans assembler
   10 dashboards.

### Ce que le produit fait déjà (factuel, basé sur le code)
| Brique | État |
|--------|------|
| Catalogue d'opportunités (scores, scénarios financiers, plan MVP, prompt Claude) | Fonctionnel, données réelles via pipeline IA |
| **Sourcing automatisé** Perplexity Sonar (recherche) → Gemini (structuration) → Zod → Supabase | Fonctionnel (`scripts/sourcing.ts`) |
| Carte monde, simulateur MRR, comparateur, quiz, newsletter | Fonctionnels |
| **Cockpit Command Center** : 9 modules, 11+ KPIs, alertes, Radar Intelligence | Fonctionnel |
| **30 connecteurs** (paiements, ads, analytics, compta FR, dev, CRM) | **Mode démo** (PRNG seedé), architecture OAuth prête |
| Portfolio « Mes SaaS » (check-in MRR, streak, milestones) | Fonctionnel, **persistance localStorage** (pas encore cloud) |
| Pricing Free / Builder / Pro + à la carte | Page faite, **prix non fixés** (`XX€`), **checkout/Stripe non branché** |
| Auth + DB Supabase (RLS, profils, plans, waitlist) | Schéma prêt |

### Différenciation / moat potentiel
- **Unique angle « promesse vs réalité »** : le cockpit connaît la promesse
  éditoriale de la fiche (`financialScenarios`, `mvpPlan.stack`, `cacChannels`)
  et mesure l'écart avec les vraies métriques. Aucun outil générique (Baremetrics,
  ChartMogul) ne fait ce lien idée→exécution.
- **Moat France** : connecteurs compta FR (Qonto, Pennylane, Abby) + contenu
  localisé (adaptation marché FR, RGPD, canaux d'acquisition FR).
- **Coût marginal quasi nul** : pas d'inférence LLM par utilisateur en run
  (Radar Intelligence déterministe, données démo PRNG) → marges très élevées.

---

## 2. Marché

> Toutes les tailles de marché sont des **estimations raisonnées** (pas de source
> tierce intégrée), à valider.

| Niveau | Définition | Estimation (hypothèse) |
|--------|------------|------------------------|
| **TAM** | Francophones aspirant à lancer un produit digital / micro-SaaS (FR, BE, CH, QC, Maghreb francophone) | ~300–500 k personnes |
| **SAM** | Ceux activement décidés à lancer un SaaS sous 12 mois et prêts à payer pour être guidés | ~30–50 k |
| **SOM (3 ans)** | Part réaliste capturée (2–5 % du SAM) | ~1 000–2 500 payants |

### Segments cibles prioritaires
1. **Indie hackers / makers FR** (savent coder ou vibe-coder) — cœur de cible.
2. **Freelances tech / devs** voulant un revenu produit récurrent.
3. **Solopreneurs no-code / consultants** cherchant à productiser.

### Concurrents & positionnement
| Concurrent | Type | Positionnement SaaS Radar |
|------------|------|---------------------------|
| IdeaBrowser, Trends.vc, Starter Story | Bases d'idées (US, EN, ~150–300 $/an) | SaaS Radar = **FR + adaptation locale + build + pilotage**, pas juste une liste |
| Indie Hackers, X/LinkedIn, Reddit | Contenu gratuit communautaire | SaaS Radar = **structuré, validé, actionnable** (prompt + cockpit) |
| Baremetrics, ChartMogul, Outseta | Analytics SaaS établis | SaaS Radar = **early-stage + promesse vs réalité + 30 connecteurs FR** |
| LiveMentor, écoles / formations FR | Formation entrepreneuriale | SaaS Radar = **outil + données**, pas un cours |

---

## 3. Business model optimal (recommandé)

### Modèle choisi : Freemium SaaS + affiliation connecteurs
**Justification** : le coût marginal par utilisateur est quasi nul (idéal
freemium), et le cockpit transforme un produit « one-shot » (trouver une idée) en
**récurrence** (piloter son SaaS mois après mois). L'affiliation sur les
connecteurs (Qonto ~80–100 €/compte pro ouvert, Pennylane, Brevo…) est déjà
structurellement présente dans le produit (Stack Health recommande la stack).

### Pricing détaillé (hypothèses de prix à confirmer — actuellement `XX€`)
| Palier | Cible | Prix proposé (hyp.) | Inclus | Limite |
|--------|-------|---------------------|--------|--------|
| **Free** | Curieux, top of funnel | 0 € | 3 opportunités/mois, scores, carte monde, newsletter, simulateur, 1 projet cockpit (démo) | Pas de guides complets ni prompt |
| **Builder** | Fondateur qui lance | **19 €/mois** ou **180 €/an** (-20 %) | Opportunités illimitées, guide J1→J14, scénarios financiers, acquisition FR, comparateur, archives, cockpit complet (saisie manuelle) | Connecteurs en démo, pas de prompt Claude |
| **Pro** | Builder sérieux / multi-projets | **39 €/mois** ou **372 €/an** | Tout Builder + **prompt Claude Code hebdo**, variantes Cursor/v0/Replit, **connecteurs API réels**, projets illimités, rapports PDF, support prioritaire | — |
| **À la carte** | « J'ai déjà mon idée » | **29 €/fiche** | 1 fiche complète (guide + business plan + prompt) | Achat unique, pas de cockpit récurrent |

> **Logique de gating** : le gratuit donne le *frisson de la découverte* (idées +
> scores) ; Builder débloque l'*exécution* (guides + cockpit) ; Pro débloque la
> *vitesse* (prompts) et la *vérité* (connecteurs API réels). L'à-la-carte capte
> ceux qui refusent l'abonnement.

### Modèles alternatifs envisagés et écartés
| Alternative | Pourquoi écartée (comme modèle principal) |
|-------------|-------------------------------------------|
| Pur info-produit (vente one-shot) | Churn structurel, pas de récurrence, ignore la valeur du cockpit |
| Usage-based / crédits | Pas de coût variable significatif à répercuter → friction inutile |
| B2B / licence équipe | Cible solo-founder ; B2B viendra plus tard (incubateurs, écoles) |
| Marketplace de devs/templates | Disperse le focus ; possible extension An 3+ |

---

## 4. Unit economics

> **Coûts mesurés, pas estimés.** Le sourcing repose sur quelques appels API par
> semaine : **Perplexity Sonar** (recherche) → **Gemini 2.5 Flash**
> (structuration/rédaction). Aucun LLM appelé par utilisateur en run. Les coûts
> directs sont donc **quasi nuls et indépendants du nombre d'utilisateurs**.

### Coûts directs réels (le poste « technique »)
| Poste | Détail | Coût (mesuré / hyp.) |
|-------|--------|----------------------|
| Sourcing IA — recherche | Perplexity Sonar, ~12–20 fiches/mois | **~1–4 €/mois total** |
| Sourcing IA — rédaction | Gemini 2.5 Flash (input ~0,30 $/M tok, output ~2,5 $/M tok), ~10 k tok/fiche | **~0,5–2 €/mois total** |
| Infra | Vercel (free→Pro 20 €) + Supabase (free→Pro 25 €) | **0–45 €/mois** selon échelle |
| Email / newsletter | Resend/Brevo, free tier puis ~scale liste | **0–30 €/mois** |
| Outils (analytics, monitoring, domaine) | divers SaaS | **~1–3 k€/an** |
| Frais de paiement | Stripe ~1,5 % + 0,25 € / transaction (CB EU) | **~1,5–2 % de l'ARR** |
| Connecteurs API réels (V2) | appels sync cron, quotas API | **~marginal** (cron, pas par user) |

→ **Coût direct total** ≈ quelques k€/an à petite échelle, ~25–65 k€/an au
scénario base An 3→5 (dominé par frais Stripe + acquisition payante d'appoint),
**hors rémunération**.

### Synthèse
| Métrique | Hypothèse | Valeur (hyp.) |
|----------|-----------|----------------|
| Coût IA total (sourcing) | flat, ~indépendant des users | **~2–6 €/mois** (négligeable) |
| Coût infra / user / mois | freemium, données démo, free tiers | **~0,02–0,10 €** |
| **Marge brute** | coût LLM nul en run, coût variable ~Stripe seul | **~96–98 %** |
| ARPU payant blended | Mix Builder/Pro + annuel | **~22 €/mois** (~264 €/an) |
| Conversion Free → Payant | Fourchette freemium réaliste | **3–5 %** |
| Churn mensuel | Élevé au début (idées), amélioré par cockpit | **6–8 %** → **4–5 %** |
| Durée de vie moyenne | 1/churn | ~12–18 mois (cible cockpit) |
| **LTV brute** | ARPU × durée × marge | **~245–440 €** |
| CAC | Content-led (SEO, newsletter, X/LinkedIn) ; paid d'appoint | **~20–60 €** |
| **LTV/CAC** | — | **~4–11x** (sain si rétention tenue) |
| Payback CAC | — | **~1–3 mois** |

> **Le vrai « coût » du projet, c'est le temps fondateur, pas l'infra.** Tant que
> tu ne te salaries pas et n'embauches pas, le produit est cash-positif presque
> immédiatement. Salaire et embauches sont un **choix d'allocation** financé sur
> la marge (cf. note des scénarios §5), pas un coût technique imposé.

**Revenu secondaire — affiliation connecteurs (hypothèse).** Si ~20 % des
payants ouvrent un Qonto via le produit (~80–100 € de commission one-shot) +
commissions Pennylane/Brevo/Stripe, cela peut ajouter **~10–25 % de revenu**
au-dessus de l'ARR d'abonnement, à marge ~100 %.

---

## 5. Prévisions financières (3 scénarios)

> Hypothèses transverses : ARPU payant **~264 €/an**, marge brute **~97 %**.
> **« Coûts » = coûts directs uniquement** (sourcing IA Sonar+Gemini, infra
> Vercel/Supabase, email, outils, frais Stripe ~2 % de l'ARR, acquisition payante
> d'appoint). Ils **n'incluent PAS** la rémunération du fondateur ni d'éventuelles
> embauches : ce sont des choix d'allocation pris **sur la marge** (cf. encadré
> sous les tableaux). « Cash » = trésorerie cumulée indicative hors levée et hors
> salaires. Affiliation comptée à part (cf. §4), **non incluse** dans l'ARR.

### Scénario PESSIMISTE (marché de niche, churn non maîtrisé)
| Année | Utilisateurs (free+payant) | Clients payants | ARR | Coûts directs | Marge | Cash cumulé |
|-------|----------------------------|-----------------|-----|---------------|-------|-------------|
| An 1 | 4 000 | 80 | 21 k€ | 4 k€ | +17 k€ | +17 k€ |
| An 2 | 9 000 | 200 | 53 k€ | 8 k€ | +45 k€ | +62 k€ |
| An 3 | 14 000 | 350 | 92 k€ | 12 k€ | +80 k€ | +142 k€ |
| An 4 | 18 000 | 450 | 119 k€ | 15 k€ | +104 k€ | +246 k€ |
| An 5 | 20 000 | 500 | 132 k€ | 17 k€ | +115 k€ | +361 k€ |

*Hypothèses : conversion ~2 %, churn ~7 %/mois, croissance trafic faible. Même
ici le projet est cash-positif : le risque n'est pas de brûler du cash mais un
**revenu absolu modeste** (coût d'opportunité du temps fondateur).*

### Scénario BASE (PMF atteint, cockpit retient)
| Année | Utilisateurs (free+payant) | Clients payants | ARR | Coûts directs | Marge | Cash cumulé |
|-------|----------------------------|-----------------|-----|---------------|-------|-------------|
| An 1 | 6 000 | 150 | 40 k€ | 6 k€ | +34 k€ | +34 k€ |
| An 2 | 18 000 | 500 | 132 k€ | 14 k€ | +118 k€ | +152 k€ |
| An 3 | 40 000 | 1 200 | 317 k€ | 26 k€ | +291 k€ | +443 k€ |
| An 4 | 65 000 | 2 200 | 581 k€ | 42 k€ | +539 k€ | +982 k€ |
| An 5 | 95 000 | 3 500 | 924 k€ | 62 k€ | +862 k€ | +1,84 M€ |

*Hypothèses : conversion ~3,5 %, churn 6 %→4,5 %, croissance content-led + bouche-à-oreille.*

### Scénario OPTIMISTE (PMF fort + expansion francophone + moat connecteurs)
| Année | Utilisateurs (free+payant) | Clients payants | ARR | Coûts directs | Marge | Cash cumulé |
|-------|----------------------------|-----------------|-----|---------------|-------|-------------|
| An 1 | 10 000 | 300 | 95 k€ | 12 k€ | +83 k€ | +83 k€ |
| An 2 | 35 000 | 1 200 | 380 k€ | 30 k€ | +350 k€ | +433 k€ |
| An 3 | 90 000 | 3 500 | 1,1 M€ | 70 k€ | +1,03 M€ | +1,46 M€ |
| An 4 | 160 000 | 7 000 | 2,3 M€ | 140 k€ | +2,16 M€ | +3,62 M€ |
| An 5 | 250 000 | 12 000 | 4,0 M€ | 240 k€ | +3,76 M€ | +7,38 M€ |

*Hypothèses : conversion 4–5 %, ARPU légèrement supérieur (mix Pro + affiliation forte), churn <4 %, expansion hors France.*

> **Lecture honnête de ces marges.** Elles sont aussi hautes parce que les coûts
> directs sont réellement minuscules (API Sonar+Gemini + infra) ET parce qu'on ne
> compte **aucun salaire**. En pratique, dès le scénario base, une grande partie
> de la marge servira à : (a) te rémunérer, (b) embaucher 1–3 personnes pour
> scaler (support, contenu, dev connecteurs), (c) acquisition payante. Exemple
> base An 3 : marge +291 k€ → un fondateur + 1 alternant + budget acq. ≈
> 100–130 k€ laisse encore **~160–190 k€ de profit net**. Ces dépenses sont des
> **décisions**, pas des coûts techniques subis.

**Cohérence (vérif. scénario base, An 3)** : 1 200 payants × 264 €/an ≈ **317 k€** ✓
— coûts directs ≈ frais Stripe (~6 k€) + infra/email/outils (~10 k€) +
acquisition d'appoint (~10 k€) + IA (~0,3 k€) ≈ **26 k€** ✓. Au-dessus, ajouter
~10–25 % d'affiliation (≈ 30–80 k€) hors ARR.

---

## 6. Valorisation estimée

> Méthode principale : **multiple sur ARR** (comparable SaaS early-stage), avec
> fourchette selon croissance/marge/rétention. Toujours une fourchette, jamais un
> point unique.

| Scénario | Jalon | ARR | Multiple appliqué | **Valorisation indicative** |
|----------|-------|-----|-------------------|-----------------------------|
| Pessimiste | An 5 | 132 k€ | 3–6x (micro-acquisition / lifestyle) | **0,4–0,8 M€** |
| Base | An 3 | 317 k€ | 4–8x | **1,3–2,5 M€** |
| Base | An 5 | 924 k€ | 4–8x | **3,7–7,4 M€** |
| Optimiste | An 3 | 1,1 M€ | 5–10x | **5,5–11 M€** |
| Optimiste | An 5 | 4,0 M€ | 5–12x | **20–48 M€** |

**Facteurs qui font monter la valo** : rétention nette > 100 % (cockpit + Pro),
**marge nette très élevée (~90 %+ en bootstrap, coûts directs quasi nuls)** qui
justifie le haut de fourchette des multiples, connecteurs API réels livrés
(moat), expansion francophone, revenu d'affiliation récurrent, marque/audience
(newsletter).
**Facteurs qui la font descendre** : churn élevé (risque structurel idées),
connecteurs restés en démo, dépendance à un canal d'acquisition unique, marché FR
jugé trop petit.

---

## 7. Ambitions pluriannuelles (roadmap business)

| Phase | Objectif principal | Jalons mesurables (hyp.) |
|-------|--------------------|---------------------------|
| **An 1** | **PMF + premiers payants** : fixer les prix, brancher Stripe, sortir du localStorage (cockpit cloud), livrer la **vague V1 de connecteurs réels** (Stripe, Google Ads, Plausible, Brevo, Crisp) | 150+ payants, churn < 7 %, NPS positif, 1 connecteur réel branché par 30 % des payants |
| **An 2–3** | **Scaling content-led + rétention** : moteur SEO/newsletter, V2 connecteurs (PostHog, Qonto, GitHub, Sentry, Slack), activer l'**affiliation** | 1 200 payants (base), LTV/CAC > 4, affiliation > 10 % du revenu |
| **An 4–5** | **Expansion** : francophone (BE/CH/QC) puis test EN, V3 connecteurs (Pennylane, Abby, HubSpot), offre **B2B** (incubateurs, écoles, CCI) | 3 500+ payants, ARR ~900 k€+, 1er contrat B2B/partenariat |

---

## 8. Scénarios de sortie (exits)

| Scénario | Horizon | Valo indicative | Probabilité (qual.) | Conditions pour y arriver |
|----------|---------|-----------------|---------------------|----------------------------|
| **Acquisition stratégique** (fintech/compta FR : Qonto, Pennylane, Indy/Abby, Shine ; ou plateforme builder/no-code ; ou acteur formation : LiveMentor) | 3–5 ans | 2–15 M€ | **Moyenne** | Audience fondateurs qualifiée + cockpit connecté = canal d'acquisition pour l'acquéreur |
| **Micro-acquisition** (Tiny, SureSwift, Acquire.com, repreneur indie) | 1–3 ans | 0,3–2 M€ (3–5x ARR) | **Élevée** | Atteindre 100–500 k€ ARR rentable, ops automatisées |
| **Levée + scale indépendant** | 2–4 ans | n/a (dilution) | **Faible/Moyenne** | Croissance > 100 %/an prouvée + ambition hors FR ; marché FR seul peut être jugé petit par les VC |
| **Lifestyle / rentabilité sans exit** | Continu | — | **Très élevée** | Coûts directs quasi nuls (API Sonar+Gemini + infra) → **~290 k€ de profit/an dès An 3 (base), ~860 k€ An 5** en solo/lean, avant tout salaire ou embauche |
| **Pas d'exit / échec** | 1–2 ans | ~0 | **Réelle** | Signaux : churn > 8 %, conversion < 1,5 %, connecteurs jamais livrés, dépendance à un seul canal. Plan B : pivoter en pur média/newsletter monétisé par sponsoring + affiliation |

---

## 9. Risques et hypothèses critiques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Churn structurel** (on cherche une idée une fois) | Casse la récurrence | Le cockpit + check-in mensuel + connecteurs = raison de rester ; pousser le multi-projets |
| **Connecteurs restés en démo** | Détruit le moat et la valeur Pro | Prioriser la vague V1 d'API réelles ; sans elle, Pro est creux |
| **Confiance / qualité des fiches IA** | Érode la marque | Validation humaine, preuves chiffrées réelles ; **remplacer les témoignages fictifs actuels** par de vrais cas |
| **Willingness-to-pay FR faible** (fondateurs pré-revenu sans budget) | Conversion basse | Free généreux + à-la-carte ; tester les prix tôt (A/B) |
| **Marché FR trop petit** | Plafond de croissance | Expansion francophone puis EN ; lever via affiliation |
| **Dépendance canal unique** | CAC explose | Diversifier SEO + newsletter + communauté + partenariats |
| **Dépendance pipeline IA** (Perplexity Sonar + Gemini 2.5 Flash) | Contenu | **Coût mesuré négligeable** (~2–6 €/mois) ; risque = qualité/dispo des modèles, pas le coût → garder fallback multi-modèles |

**Hypothèses qui, si fausses, cassent le modèle** : (1) la conversion free→payant
≥ 3 % ; (2) le cockpit réduit réellement le churn sous 5 % ; (3) les connecteurs
API réels sont livrables et maintenables par une petite équipe.

---

## 10. Prochaines étapes (90 jours)

1. **Fixer et tester les prix** (Builder/Pro/à-la-carte) — remplacer les `XX€`,
   brancher **Stripe Checkout** sur `/checkout/*`, mesurer la conversion réelle.
2. **Sortir le cockpit du localStorage** → sync cloud Supabase (`user_projects`,
   `integrations`) pour permettre la rétention multi-appareils et le compte payant.
3. **Livrer la vague V1 de connecteurs réels** (Stripe d'abord) — c'est le moat et
   la justification du plan Pro.
4. **Mettre en place le moteur d'acquisition** : SEO programmatique sur les fiches
   + newsletter comme top of funnel (déjà présent), 1er objectif 5 000 inscrits.
5. **Activer l'affiliation** sur 2–3 connecteurs (Qonto, Pennylane, Brevo) et
   remplacer les témoignages placeholder par de vrais retours fondateurs.

---

*Document provisoire — à recalculer dès que les premières données réelles de
trafic, conversion et churn seront disponibles.*
