# SaaS Radar — Pitch produit & vision finale

> Document de référence · juin 2026  
> Vision produit cible — indépendante des tarifs en vigueur sur le site (en cours de refonte).

---

## En une phrase

**SaaS Radar est le compagnon de bout en bout du fondateur de micro-SaaS francophone** : il détecte chaque semaine des opportunités validées à l'étranger, donne le plan exact pour les adapter et les construire en France, puis un cockpit unique mesure si la réalité tient la route — de l'idée au premier euro de MRR, puis au scale.

---

## Le problème

Lancer un micro-SaaS en France, aujourd'hui, c'est enchaîner trois échecs silencieux :

1. **Quoi construire ?** — Des centaines d'idées circulent sur Reddit, X et Indie Hackers. Aucune n'est triée, adaptée au marché français, ni chiffrée.
2. **Comment le construire vite ?** — Le vibe coding a abaissé la barrière technique, pas celle de la stratégie : stack, MVP, go-to-market restent flous.
3. **Est-ce que ça marche ?** — Une fois lancé, le fondateur assemble 10 outils (Stripe, analytics, ads, compta, CRM…) sans jamais savoir s'il tient l'objectif qu'il s'était fixé.

Résultat : des semaines perdues sur la mauvaise idée, des MVPs livrés sans acquisition, des dashboards éparpillés sans fil conducteur.

---

## La promesse

> Chaque semaine, découvrez un micro-SaaS qui fonctionne à l'étranger.  
> Évaluez s'il peut marcher en France.  
> Obtenez le plan exact pour le construire — puis pilotez-le jusqu'au MRR cible.

SaaS Radar ne vend pas une liste d'idées. Il vend un **parcours complet idée → build → lancement → pilotage**, avec une boucle de rétention : tant que le fondateur construit et fait grandir son SaaS, la plateforme reste son tableau de bord.

---

## Vision produit finale

### Positionnement

| Dimension | SaaS Radar (vision finale) |
|-----------|----------------------------|
| **Catégorie** | Plateforme d'intelligence + cockpit de pilotage pour micro-SaaS |
| **Géographie** | Francophonie d'abord (FR, BE, CH, QC), expansion internationale ensuite |
| **Cible** | Indie hackers, devs, solopreneurs no-code — solo ou petite équipe |
| **Moment** | De « je cherche quoi lancer » à « je scale mon 3ᵉ produit » |
| **Différenciateur** | Seul outil qui relie la **projection éditoriale** de l'opportunité aux **métriques réelles** du fondateur |

### Les cinq piliers

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  DÉCOUVERTE │ → │    BUILD    │ → │  CAMPAGNE   │ → │   COCKPIT   │ → │  RÉTENTION  │
│  Opportunités│   │  MVP 14 j   │   │  Go-to-mkt  │   │  Command    │   │  Check-in   │
│  validées   │   │  prompts IA │   │  guidé      │   │  Center     │   │  alertes    │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

#### 1. Découverte — « Quoi construire ? »

- **Catalogue d'opportunités** sourcé automatiquement : micro-SaaS qui tournent à l'étranger, scorés et adaptés au marché français.
- Chaque fiche inclut : pitch, scores (opportunité, fit France, buildability, marge, concurrence), signaux de traction du concurrent US, scénarios financiers (Prudent / Réaliste / Optimiste), plan MVP J1→J14, stack recommandée, canaux d'acquisition FR, templates email.
- **Carte monde interactive**, comparateur, simulateur MRR, quiz « Quel SaaS pour moi ? », newsletter hebdomadaire.
- Pipeline IA automatisé (recherche + structuration + validation) alimentant le catalogue en continu.

#### 2. Build — « Comment le construire ? »

- Module **Build** dans le cockpit : parcours en 3 étapes (choix stack → génération prompt → mise en ligne).
- Prompts prêts à coller dans **Claude Code, Cursor, v0, Replit** — adaptés à la stack de la fiche.
- **Launch Room** : micro-victoires guidées, journal de lancement, trajectoire Radar vs réel.
- Passage automatique en phase `launch` quand l'app est en ligne.

#### 3. Campagne — « Comment l'acquérir ? »

- Module **Campagne** : le Build du go-to-market.
- Parcours en **4 phases** : Fondations (ICP, objectif, message) → Création (contenus canal par canal) → Diffusion (séquences multicanal) → Mesure (check-in hebdo, itération).
- Orchestration d'outils externes (Claude, Lemlist, Creatify, Higgsfield, Canva…) via briefs et prompts générés — sans remplacer ces outils.
- Gates infra : pas de diffusion sans tracking, CRM et assets minimum.
- Pont direct vers le module **Acquisition** pour fermer la boucle ROAS / funnel.

#### 4. Cockpit — « Est-ce que ça marche ? »

Le **Command Center** est le cœur de la rétention :

- **9 modules** : Vue d'ensemble, Revenus, Acquisition, Produit, Finance, Clients, Build & Ship, Intégrations, Rapports.
- **30 connecteurs** natifs : Stripe, Google Ads, Meta, LinkedIn Ads, Plausible, PostHog, Brevo, Crisp, Qonto, Pennylane, Abby, GitHub, Vercel, Sentry, HubSpot…
- **Projection fiche vs réel** : le cockpit connaît le scénario éditorial de l'opportunité (`financialScenarios`, `mvpPlan.stack`, `cacChannels`) et affiche l'écart avec les métriques réelles.
- **Radar Intelligence** : actions contextuelles priorisées (connecter la stack, lancer une campagne, corriger le churn, check-in MRR…).
- **Alertes automatiques** : runway, ROAS, churn, erreurs Sentry, données obsolètes, connecteurs P0 manquants.
- **Stack Health** : couverture des outils recommandés vs connectés.
- Portfolio **Mes SaaS** : multi-projets, check-in MRR mensuel, streak, milestones, rapports PDF.

#### 5. Rétention — « Pourquoi rester abonné ? »

La découverte attire ; le cockpit retient :

- Check-in MRR mensuel avec score de discipline.
- Alertes proactives quand la trajectoire dévie du scénario cible.
- Boucle Campagne → Acquisition → itération créative.
- Support du **multi-projets** pour les fondateurs en mode « portfolio indie ».

---

## Parcours utilisateur (vision finale)

```
Accueil / Carte monde / Newsletter
         │
         ▼
   Fiche opportunité ──► « Je build cette opportunité »
         │
         ▼
   Launch Room (3 micro-victoires)
         │
         ▼
   Cockpit Mode Focus (Build)
         │
         ├──► Build : stack + prompt + mise en ligne
         │
         ├──► Campagne : Fondations → Création → Diffusion → Mesure
         │
         └──► Pilotage : Revenus · Acquisition · Finance · Clients…
                    │
                    ▼
              Check-in MRR mensuel
              Alertes · Radar Intelligence
              Itération Campagne
```

**Phases projet** : `build` → `launch` → `revenue` → `paused`  
**Scénarios comparés** : Prudent · Réaliste · Optimiste (depuis la fiche Radar)

---

## Cible & marché

### Personas principaux

| Persona | Profil | Douleur | Déclencheur d'achat |
|---------|--------|---------|---------------------|
| **Maker prêt à lancer** | Dev / no-codeur, a décidé de lancer ce trimestre | Peur de perdre des semaines sur une mauvaise idée | Une fiche concrète + plan J1→J14 |
| **Fondateur en pilotage** | SaaS live, MRR > 0, dashboards éparpillés | Ne sait pas s'il tient son objectif | Cockpit projection vs réel + connecteurs FR |
| **Portfolio builder** | 2–3 projets en parallèle | Manque de structure entre idées | Multi-projets + comparateur + alertes |

### Marché adressable (hypothèses)

- **TAM** : ~300–500 k francophones aspirant à lancer un produit digital.
- **SAM** : ~30–50 k activement décidés à lancer un SaaS sous 12 mois.
- **SOM (3 ans)** : ~1 000–2 500 clients payants.

### Concurrence & différenciation

| Concurrent | Ce qu'il fait | Ce que SaaS Radar apporte en plus |
|------------|---------------|-----------------------------------|
| IdeaBrowser, Trends.vc, Starter Story | Bases d'idées US, contenu inspiration | Adaptation FR + build + pilotage, pas juste une liste |
| Indie Hackers, X, Reddit | Contenu gratuit communautaire | Structuré, validé, actionnable (prompt + cockpit) |
| Baremetrics, ChartMogul | Analytics SaaS post-revenu | Early-stage + lien idée→exécution + connecteurs FR |
| LiveMentor, formations | Cours entrepreneuriaux | Outil + données en continu, pas un cours one-shot |

**Moat défendable** : connecteurs compta FR (Qonto, Pennylane, Abby) + contenu localisé + boucle projection fiche / réel qu'aucun outil générique ne reproduit.

---

## Modèle économique

### Structure globale

**Freemium SaaS** (abonnements récurrents) + **achat à la carte** (tripwire) + **affiliation connecteurs** (revenu passif) + **B2B** (phase ultérieure : incubateurs, écoles, CCI).

La marge brute cible est très élevée : pas d'inférence LLM par utilisateur en run (sourcing batch hebdomadaire), coût marginal quasi nul par compte. Chaque palier payant finance la rétention via le cockpit, pas seulement la découverte d'idées.

### Logique de gating

| Étape du parcours | Ce que le gratuit donne | Ce que l'abonnement débloque |
|-------------------|-------------------------|------------------------------|
| Découverte | Frisson : idées, scores, carte, newsletter | Catalogue illimité, guides complets, archives |
| Exécution | Aperçu du parcours | Build complet, prompts IA, module Campagne |
| Pilotage | Cockpit démo (1 projet) | Cockpit cloud, connecteurs API réels, multi-projets |
| Vitesse | — | Prompts premium, variantes outils, rapports PDF, support prioritaire |

---

## Grille tarifaire cible (vision finale)

> Les montants ci-dessous décrivent la **grille visée** une fois le produit mature (connecteurs réels, cockpit cloud, Campagne complète). Ils ne reflètent pas les tarifs actuellement affichés sur le site.

### Palier Free — Découverte

**Prix** : 0 €  
**Cible** : Curieux, top of funnel, makers en phase d'exploration.

**Inclus** :
- 3 opportunités par mois (scores + pitch)
- Carte monde interactive
- Newsletter et flash quotidien
- Simulateur MRR
- Quiz « Quel SaaS pour moi ? »
- 1 projet cockpit en mode démo

**Limites** : pas de guides complets J1→J14, pas de prompts IA, pas de génération Campagne, pas de connecteurs API réels.

---

### Palier Builder — Exécution

**Prix cible** : **24 €/mois** · **228 €/an** (≈ −21 % vs mensuel)  
**Cible** : Fondateur qui a choisi son idée et veut lancer vite.

**Inclus** :
- Tout Free
- Opportunités illimitées + archives
- Guide complet J1→J14 par fiche
- Scénarios financiers détaillés + stratégie acquisition France
- Prompt Claude Code (et variantes selon stack)
- Module Build complet + Launch Room
- Module Campagne (briefs statiques + génération kits IA)
- Cockpit complet en saisie manuelle
- Comparateur d'opportunités
- Portfolio « Mes SaaS » synchronisé cloud

**Limites** : connecteurs en mode démo ou saisie manuelle ; pas de sync API réelle ; 1 projet actif (2 en archive).

---

### Palier Pro — Pilotage & vitesse

**Prix cible** : **49 €/mois** · **468 €/an** (≈ −21 % vs mensuel)  
**Cible** : Fondateur sérieux, SaaS live ou multi-projets, budget outils existant.

**Inclus** :
- Tout Builder
- **Connecteurs API réels** (Stripe, Google Ads, Plausible, Brevo, Crisp, Qonto, PostHog, GitHub, Sentry…)
- Projets illimités
- Prompts premium hebdomadaires (Claude Code, Cursor, v0, Replit)
- Génération Campagne illimitée (kits IA multicanal)
- Emails cold et séquences prêtes à envoyer
- Rapports PDF mensuels exportables
- Alertes avancées + Radar Intelligence prioritaire
- Support email prioritaire (< 24 h)

**Positionnement prix** : environ **3 à 5× moins cher** qu'IdeaBrowser Pro (499 $/an, annuel obligatoire), avec cockpit + localisation FR inclus — argument d'ancrage commercial.

---

### Achat à la carte — Tripwire

**Prix cible** : **39 €** · achat unique  
**Cible** : « J'ai déjà mon idée » ou refus de l'abonnement.

**Inclus** :
- 1 fiche opportunité complète
- Guide J1→J14 + business plan + prompt IA
- Accès cockpit 30 jours (saisie manuelle)

**Rôle commercial** : premier euro le plus facile à encaisser ; convertisseur vers Builder (un acheteur à la carte convertit bien mieux qu'un inscrit gratuit).

---

### Offre Team — B2B (phase 2)

**Prix cible** : **sur devis** · à partir de **199 €/mois** pour 10 sièges  
**Cible** : Incubateurs, écoles, programmes entrepreneuriaux (Station F, Kedge, Ynov, CCI…).

**Inclus** :
- Licences groupées Builder ou Pro
- Dashboard admin (usage, projets actifs)
- Atelier onboarding 45 min
- Branding optionnel « propulsé par SaaS Radar »

---

### Essai & lancement

| Mécanisme | Description |
|-----------|-------------|
| **Essai Pro 7 jours** | Carte requise, conversion cible 25–35 % (vs 2–5 % freemium pur) |
| **Garantie 14 jours** | Satisfait ou remboursé sur tous les paliers payants |
| **Founding Members** (lancement) | Places limitées, tarif préférentiel annuel verrouillé — finance le build + preuve sociale |
| **Remise annuelle** | −21 % pour favoriser l'encaissement upfront et réduire le churn |

---

### Revenus complémentaires

| Source | Mécanisme | Potentiel |
|--------|-----------|-----------|
| **Affiliation connecteurs** | Qonto (~80–100 €/compte), Brevo, Pennylane recommandés dans Stack Health | +10–25 % de revenu au-dessus de l'ARR abonnements |
| **Partenariats communautés** | Revenue share avec animateurs IndieMakers, IA.Builders, SoloTryb | Acquisition qualifiée à CAC ~0 |
| **Sponsoring newsletter** | Une fois > 5 000 inscrits | Revenu média complémentaire |

---

## Métriques de succès produit (vision)

| Indicateur | Cible |
|------------|-------|
| Conversion Free → Payant | 3–5 % |
| Churn mensuel (avec cockpit actif) | < 5 % |
| LTV/CAC | > 4× |
| % projets live ouvrant Campagne | > 40 % |
| % payants connectant ≥ 1 connecteur réel | > 30 % |
| Durée de vie moyenne abonné | 12–18 mois |

---

## Roadmap produit (jalons vision)

| Phase | Horizon | Livrables clés |
|-------|---------|----------------|
| **Lancement commercial** | T0 | Tarification finalisée, Stripe actif, cockpit cloud, connecteurs V1 réels (Stripe, Google Ads, Plausible, Brevo, Crisp) |
| **Rétention** | T0 + 6 mois | Campagne v2 complète, connecteurs V2 (PostHog, Qonto, GitHub, Sentry, Slack), affiliation active |
| **Scale** | T0 + 12–18 mois | Connecteurs V3 (Pennylane, Abby, HubSpot), offre Team B2B, expansion francophone (BE, CH, QC) |
| **Moat** | T0 + 24 mois | Boucle intelligente Campagne ↔ Acquisition, recommandations auto depuis connecteurs, test marché EN |

---

## Message pitch (30 secondes)

> Tu veux lancer un micro-SaaS en France, mais tu ne sais pas quoi construire — et une fois lancé, tu ne sais pas si tu tiens le cap ?
>
> SaaS Radar te livre chaque semaine des opportunités déjà validées à l'étranger, avec le plan exact pour les adapter et les builder en 14 jours avec l'IA.
>
> Et une fois en ligne, ton cockpit compare en temps réel ta projection au réel — revenus, acquisition, runway — via 30 connecteurs pensés pour les fondateurs français.
>
> Ce n'est pas une liste d'idées. C'est le compagnon de build idée → MRR.

---

## Message pitch (investisseur / partenaire)

SaaS Radar transforme un produit naturellement « one-shot » (trouver une idée) en **compagnon récurrent** (piloter son SaaS mois après mois). Le modèle freemium alimente un funnel content-led (newsletter, SEO, build-in-public) ; le cockpit et les connecteurs FR créent un moat que les bases d'idées US ne peuvent pas répliquer. Coût marginal quasi nul, marge brute > 95 %, expansion francophone puis internationale. Cible : devenir l'infrastructure de référence du micro-SaaS bootstrap en francophonie.

---

## Synthèse

| | |
|---|---|
| **Quoi** | Plateforme idée → build → campagne → pilotage pour micro-SaaS FR |
| **Pour qui** | Indie hackers et solopreneurs francophones |
| **Pourquoi maintenant** | Vague vibe coding + absence de leader outil FR + besoin de pilotage early-stage |
| **Différenciateur** | Projection fiche vs réel + 30 connecteurs FR + parcours Campagne guidé |
| **Business model** | Freemium (Free / Builder / Pro) + à la carte + affiliation + B2B |
| **Rétention** | Cockpit Command Center + check-in MRR + alertes + multi-projets |

---

*Document de vision produit — SaaS Radar · juin 2026*
