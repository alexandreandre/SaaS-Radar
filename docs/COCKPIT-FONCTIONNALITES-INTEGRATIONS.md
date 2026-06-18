# SaaS Radar — Fonctionnalités & Intégrations (référence complète)

Document de référence produit et technique pour la plateforme **SaaS Radar**, avec focus sur le parcours builder, le **Command Center** (cockpit) et les **30 connecteurs** disponibles.

> **État actuel (mars 2026)** : mode **hybrid_ready** — toutes les intégrations fonctionnent en **mode démo** (données générées localement). L’architecture (types, registre, streams, stub OAuth) est prête pour brancher de vraies API via Supabase + routes `/api/connectors/*`.

---

## Table des matières

1. [Vision produit](#1-vision-produit)
2. [Parcours utilisateur](#2-parcours-utilisateur)
3. [Pages & routes](#3-pages--routes)
4. [Portfolio « Mes SaaS »](#4-portfolio--mes-saas)
5. [Command Center (Cockpit)](#5-command-center-cockpit)
6. [Modules cockpit (détail)](#6-modules-cockpit-détail)
7. [KPIs & métriques calculées](#7-kpis--métriques-calculées)
8. [Alertes automatiques](#8-alertes-automatiques)
9. [Radar Intelligence (actions)](#9-radar-intelligence-actions)
10. [Stack Health](#10-stack-health)
11. [Modèle de données](#11-modèle-de-données)
12. [Catalogue des 30 connecteurs](#12-catalogue-des-30-connecteurs)
13. [Streams par connecteur](#13-streams-par-connecteur)
14. [Marketplace intégrations](#14-marketplace-intégrations)
15. [Architecture technique](#15-architecture-technique)
16. [Roadmap API réelles](#16-roadmap-api-réelles)

---

## 1. Vision produit

SaaS Radar est un **compagnon de build** pour fondateurs de micro-SaaS en France :

| Pilier | Description |
|--------|-------------|
| **Découverte** | Catalogue d’opportunités validées (marché US → adaptation FR) |
| **Engagement** | Bouton « Je build cette opportunité » → projet dans Mes SaaS |
| **Pilotage** | Cockpit Command Center : projection fiche vs réel |
| **Centralisation** | 30 connecteurs (paiements, pub, analytics, compta FR, dev, CRM…) |
| **Rétention** | Check-in MRR mensuel, streak, alertes, actions Radar |

**Différenciateur** : seul cockpit qui connaît le **scénario éditorial** de la fiche opportunité (`financialScenarios`, `mvpPlan.stack`, `cacChannels`) et mesure l’écart vs la réalité du fondateur.

---

## 2. Parcours utilisateur

```
Fiche opportunité (/opportunities/[slug])
    │
    ├─► « Je build cette opportunité » (Quick Launch — 1 choix : où en êtes-vous ?)
    │
    ▼
Launch Room (/cockpit/[id]/launch) — 3 micro-victoires
    │   1. Preview Semaine 1
    │   2. Première étape cochée (+ confetti)
    │   3. Trajectoire Radar + stack MVP
    │
    ▼
Cockpit Mode Focus (/cockpit/[id]?module=build&focus=1)
    │   Journal prominent · 3 modules · zéro alerte J1
    │   Déblocage cockpit complet : 3 milestones OU skip
    │
    ▼
Cockpit complet (/cockpit/[id])
    │
Mes SaaS (/mes-saas) — portfolio + stats (bannière ?welcome=1 après création)
```

**Phases projet** : `build` → `launch` → `revenue` → `paused`

**Scénarios cibles** (depuis fiche Radar) : `Prudent` | `Réaliste` | `Optimiste`

---

## 3. Pages & routes

| Route | Rôle |
|-------|------|
| `/` | Accueil, carte monde, feed opportunités |
| `/opportunities` | Catalogue filtrable |
| `/opportunities/[slug]` | Fiche détaillée + CTA build |
| `/mes-saas` | Espace builder : briefing projet actif, portfolio, favoris |
| `/cockpit/[id]` | Command Center par projet |
| `/cockpit/[id]?module=revenus` | Deep link module (9 valeurs possibles) |
| `/dashboard` | Redirige vers `/mes-saas` |
| `/simulator` | Simulateur financier (lié au projet) |
| `/pricing`, `/quiz`, `/newsletter`, `/world` | Pages marketing / contenu |

---

## 4. Portfolio « Mes SaaS »

### 4.1 Données projet (`UserProject`)

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `opportunitySlug` | string | Lien vers fiche Radar |
| `startedAt` | ISO date | Date de démarrage |
| `phase` | `build \| launch \| revenue \| paused` | Phase actuelle |
| `currentMrr` | number | MRR courant (€) |
| `mrrHistory` | `MrrEntry[]` | Historique check-ins |
| `targetScenario` | `Prudent \| Réaliste \| Optimiste` | Scénario comparé |
| `milestones` | `Milestone[]` | Journal pré-rempli depuis fiche |
| `lastCheckInAt` | ISO date? | Dernier check-in |
| `checkInStreak` | number | Mois consécutifs |
| `metricsHistory` | `MetricsSnapshot[]` | Snapshots mensuels agrégés |
| `campaigns` | `AdCampaign[]` | Campagnes pub manuelles |
| `expenses` | `Expense[]` | Dépenses |
| `integrations` | `Integration[]` | Connecteurs liés |
| `connectorStreams` | `ConnectorStreams` | Données stream par connecteur |
| `cashOnHand` | number | Trésorerie manuelle (défaut 5 000 €) |

**Persistance** : `localStorage` clé `saas-radar:portfolio`

### 4.2 Actions portfolio (`PortfolioProvider`)

| Action | Description |
|--------|-------------|
| `addProject(slug, input)` | Crée projet depuis opportunité (milestones, campagnes, dépenses par défaut) |
| `removeProject(id)` | Supprime un projet |
| `updateProject(id, patch)` | Mise à jour partielle |
| `setProjectPhase(id, phase)` | Change la phase |
| `recordMrr(id, amount, note?)` | Check-in MRR + streak + snapshot mensuel |
| `toggleMilestone(id, milestoneId)` | Coche/décoche étape journal |
| `connectIntegration(id, connectorId)` | Connecte (démo) : merge snapshots + streams |
| `disconnectIntegration(id, connectorId)` | Déconnecte + purge stream |
| `syncIntegration(id, connectorId)` | Re-sync (= reconnect démo) |
| `addCampaign / updateCampaign / removeCampaign` | CRUD campagnes pub |
| `addExpense / removeExpense` | CRUD dépenses |
| `logMetricsSnapshot(id, partial)` | Saisie manuelle métriques |
| `setCashOnHand(id, amount)` | Trésorerie manuelle |

### 4.3 Milestones automatiques

**Depuis `launchTimeline` opportunité** : une entrée par action de chaque semaine (ex. `S1 — Setup repo`).

**Milestones revenu fixes** :
- Landing créée
- Premier email envoyé
- Premier prospect
- Première démo
- Premier client payant
- 1 000 € MRR atteint

### 4.4 Check-in MRR

| Règle | Valeur |
|-------|--------|
| Alerte retard | ≥ 25 jours sans check-in |
| Fenêtre streak | 35 jours max entre deux check-ins |
| Score discipline | `min(100, streak × 25) %` |
| Navbar | Point orange si check-in en retard sur un projet actif |

---

## 5. Command Center (Cockpit)

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header : nom, pitch, scénario cible, phase, scénario       │
├─────────────────────────────────────────────────────────────┤
│  Pulse bar (sticky) : MRR | Objectif | Clients | Runway |   │
│                       ROAS | Alertes critiques              │
├──────────┬──────────────────────────────┬───────────────────┤
│ Sidebar  │  Module actif                │  Panneau actions  │
│ 9 modules│  (contenu scroll)            │  Check-in MRR     │
│ + badges │                              │  Radar Intel #1   │
│ alertes  │                              │  Autres actions   │
│          │                              │  Saisie manuelle  │
│          │                              │  Score discipline │
└──────────┴──────────────────────────────┴───────────────────┘
```

**Desktop** : grid `220px / 1fr / 280px`  
**Mobile** : sidebar horizontale scrollable + panneau actions en dessous

### 5.2 Navigation modules

| Paramètre URL | Module | Label |
|---------------|--------|-------|
| `?module=overview` | Vue d'ensemble | KPIs, trajectoire MRR, alertes |
| `?module=revenus` | Revenus | MRR, ARR, NRR, historique |
| `?module=acquisition` | Acquisition | Campagnes, ROAS, funnel |
| `?module=produit` | Produit | Signups, MAU, activation |
| `?module=finance` | Finance | Trésorerie, burn, compta FR |
| `?module=clients` | Clients | Support, CRM, health score |
| `?module=build` | Build & Ship | Journal, GitHub, Sentry |
| `?module=integrations` | Intégrations | Marketplace connecteurs |
| `?module=rapports` | Rapports | PDF mensuel, partage MRR |

**Legacy mapping** : `budget` → `finance`, `journal` → `build`

### 5.3 Composants shell

| Fichier | Rôle |
|---------|------|
| `cockpit-header.tsx` | En-tête + bandeau scénario + pills phase/scénario |
| `cockpit-pulse-bar.tsx` | 6 tuiles KPI sticky |
| `cockpit-sidebar.tsx` | Navigation verticale + compteur alertes |
| `cockpit-shell.tsx` | Orchestration layout + routing `?module=` |
| `cockpit-actions-panel.tsx` | Check-in, Radar Intelligence, discipline |
| `stack-health-bar.tsx` | Connecteurs recommandés vs connectés |

### 5.4 Hook central `useCockpitData`

Agrège pour un couple `(UserProject, Opportunity)` :

- `metrics` — KPIs dérivés
- `alerts` — alertes actives
- `stackHealth` — couverture stack
- `radarActions` — actions priorisées
- `history` — snapshots mensuels
- `chartData` — courbe projection fiche vs réel (12 mois)
- `gap` — écart % vs scénario cible
- `target` — MRR objectif Radar
- `milestoneProgress` — % journal complété
- `criticalAlerts` — nombre alertes critiques

---

## 6. Modules cockpit (détail)

### 6.1 Vue d'ensemble (`overview`)

| Fonctionnalité | Source |
|----------------|--------|
| Grille KPI (11 métriques + sparklines) | `buildCockpitMetrics` |
| Stack health bar | `buildStackHealth` |
| Graphique trajectoire MRR (12 mois) | `buildScenarioCurve` + `mergeRealityCurve` |
| Callout écart objectif (+% ou montant restant) | `getTargetGapPercent` |
| Panel alertes (clic → navigation module) | `buildCockpitAlerts` |
| Prochaine action (Radar Intelligence #1) | `buildRadarActions` |
| Saisie métriques manuelles | `ManualMetricsDialog` |
| Bannière mode démo | si intégration `status: demo` |

### 6.2 Revenus (`revenus`)

| Fonctionnalité | Données |
|----------------|---------|
| Tuiles MRR, ARR, ARPU, NRR | snapshots + calculs |
| Widget paiements échoués Stripe | stream `payment` |
| Chart MRR breakdown (new/expansion/churn) | `MrrBreakdownChart` |
| Chart courbe ARR | `ArrLineChart` |
| Chart rétention revenus | `RetentionCurveChart` |
| Tableau historique mensuel | `metricsHistory` |

**Connecteurs utiles** : Stripe, Lemon Squeezy, Paddle, Freemius

### 6.3 Acquisition (`acquisition`)

| Fonctionnalité | Données |
|----------------|---------|
| Table campagnes (CRUD) | `project.campaigns` |
| Chart dépenses par canal | `SpendByChannelChart` |
| Chart ROAS par campagne | `RoasByChannelChart` |
| Funnel acquisition | `AcquisitionFunnelChart` |
| Canal recommandé Radar | `opportunity.acquisition[0]` |
| Template email copiable | `opportunity.emailTemplates[0]` |

**Canaux campagne** : `google`, `meta`, `linkedin`, `tiktok`, `microsoft`, `other`

**Connecteurs utiles** : Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, Microsoft Ads, Brevo

### 6.4 Produit (`produit`)

| Fonctionnalité | Données |
|----------------|---------|
| Signups, MAU, DAU, Trial→Paid | snapshots |
| Activation, rétention D7, feature top | stream `product` (PostHog/Mixpanel/Fathom) |
| Funnel produit | `AcquisitionFunnelChart` |
| Courbe rétention | `RetentionCurveChart` |

**Connecteurs utiles** : Plausible, GA4, PostHog, Mixpanel, Fathom

### 6.5 Finance (`finance`)

| Fonctionnalité | Données |
|----------------|---------|
| Trésorerie, burn rate, runway | calculs + `cashOnHand` |
| Alerte écart Qonto vs saisie manuelle (> 10 %) | stream `finance` |
| Input trésorerie manuelle | `setCashOnHand` |
| Chart flux trésorerie | `CashFlowChart` (Qonto) |
| CA comptable, charges, TVA | stream `accounting` |
| Chart CA comptable vs MRR Stripe | `AccountingVsMrrChart` |
| Donut répartition dépenses | `ExpenseDonutChart` |
| Projection runway | `RunwayChart` |
| Table dépenses (CRUD) | `ExpenseTable` |

**Connecteurs utiles** : Qonto, Pennylane, Abby + dépenses manuelles

**Catégories dépenses** : `infra`, `ads`, `tools`, `salary`, `other`

### 6.6 Clients (`clients`)

| Fonctionnalité | Données |
|----------------|---------|
| Clients actifs, tickets, CSAT | streams support + snapshots |
| Pipeline, deals gagnés/perdus, cycle | stream `crm` |
| Table clients synthétique (12 lignes) | `generateDemoClients` (seedé) |
| Health score client | règles : inactivité + tickets = risque |
| Statuts client | `active`, `at_risk`, `churned` |

**Connecteurs utiles** : Crisp, Intercom, Zendesk, HubSpot, Pipedrive

### 6.7 Build & Ship (`build`)

| Fonctionnalité | Données |
|----------------|---------|
| Journal de lancement (milestones cochables) | `LaunchJournalTracker` |
| Timeline événements | `ProjectTimeline` (création, check-ins, milestones) |
| Widget GitHub (deploys, issues, uptime) | stream `dev` |
| Widget Sentry (error rate, issues) | stream `dev` |
| Widget Vercel (uptime, deploys, coût infra) | stream `dev` + `infraCosts` opportunité |
| Hypothèses simulateur + lien | `financialScenarios` → `/simulator?from=` |

**Connecteurs utiles** : GitHub, Vercel, Sentry, Better Stack

### 6.8 Intégrations (`integrations`)

| Fonctionnalité | Description |
|----------------|-------------|
| Stack health (compact) | Couverture connecteurs recommandés |
| Marketplace groupée par job | 9 groupes, 30 connecteurs |
| Filtre priorité P0/P1/P2 | badges sur cartes |
| Recherche textuelle | nom + description |
| Connecter (démo) | merge snapshots + streams |
| Synchroniser | re-génération démo seedée |
| Déconnecter | statut + purge stream |

### 6.9 Rapports (`rapports`)

| Fonctionnalité | Description |
|----------------|-------------|
| Rapport mensuel structuré | KPIs, alertes, progression |
| Export PDF | jsPDF côté client |
| Carte partage MRR | partage réseaux (LinkedIn, etc.) |

---

## 7. KPIs & métriques calculées

### 7.1 Pulse bar (6 tuiles)

| Tuile | Source |
|-------|--------|
| MRR | snapshot latest / check-in |
| Objectif | écart % vs scénario + % objectif |
| Clients | `customers` snapshot |
| Runway | `computeRunwayMonths` |
| ROAS | `computeRoas(campaigns)` |
| Alertes | count alertes `critical` |

### 7.2 Grille KPI complète (`buildCockpitMetrics`)

| KPI | Calcul |
|-----|--------|
| MRR | snapshot ou `currentMrr` |
| ARR | MRR × 12 |
| Clients | `customers` |
| MAU | `mau` |
| CAC | `adSpend / conversions` |
| LTV | `ARPU / churnRate` (approx) |
| LTV/CAC | ratio |
| Churn | `(churnedMrr / mrr) × 100` |
| ROAS | revenus campagnes / spend |
| Runway | `cashOnHand / burnRate` |
| Objectif Radar | MRR scénario cible |
| **NRR** | `(mrr / startMrr) × 100` approx |
| **targetProgressPct** | `mrr / target × 100` |
| **stackCoveragePct** | connectés / recommandés |
| **failedPayments** | stream Stripe `payment` |

### 7.3 Métriques snapshot (`MetricsSnapshot`)

Champs mensuels unifiés (clé `YYYY-MM`) :

| Champ | Description |
|-------|-------------|
| `mrr`, `newMrr`, `expansionMrr`, `churnedMrr` | Composition MRR |
| `customers` | Clients actifs |
| `arr` | ARR (optionnel) |
| `signups`, `trials` | Acquisition produit |
| `activeUsers`, `mau`, `dau` | Engagement |
| `adSpend`, `impressions`, `clicks`, `conversions` | Publicité |
| `source` | Connecteur ou `manual` |

---

## 8. Alertes automatiques

| ID | Sévérité | Condition | Module cible |
|----|----------|-----------|--------------|
| `ad-budget` | warning | spend > budget campagnes actives | acquisition |
| `cac-ltv` | critical | CAC > LTV/3 | acquisition |
| `churn-spike` | warning | churn > 1.5× moyenne et > 5 % | revenus |
| `runway` | warning/critical | runway < 6 mois (< 3 = critical) | finance |
| `stale-data` | info | pas de mise à jour > 30 jours | overview |
| `roas-{id}` | warning | ROAS < 1 sur campagne active | acquisition |
| `sentry-spike` | critical | error rate Sentry > 10 % | build |
| `uptime-low` | warning | uptime Vercel/Better Stack < 99 % | build |
| `crm-stagnant` | info | pipeline > 0 €, 0 deal gagné | clients |
| `cash-mismatch` | warning | écart Qonto vs manuel > 10 % | finance |
| `missing-p0` | warning | connecteur P0 manquant en phase revenue | integrations |

---

## 9. Radar Intelligence (actions)

Actions contextuelles déterministes (pas d’IA externe), priorisées `high` → `medium` → `low`.

| ID | Priorité | Déclencheur | Module | Connecteur suggéré |
|----|----------|-------------|--------|-------------------|
| `connect-stack` | high | phase revenue + connecteur recommandé manquant | integrations | nextRecommended |
| `launch-campaign` | high | MRR < 30 % objectif + 0 campagne active | acquisition | google-ads |
| `reallocate-ads` | medium | ROAS Meta < 1 et Google > 2 | acquisition | — |
| `fix-errors-churn` | high | Sentry error > 5 % + churn > 5 % | build | sentry |
| `runway-low` | high/medium | runway < 6 mois | finance | qonto |
| `check-in` | medium | pas de check-in > 25 jours | overview | — |
| `first-milestone` | medium | MRR = 0, aucune autre action | build | — |

Affichage :
- **Panneau actions** : action #1 + liste 2–4 suivantes
- **Vue d'ensemble** : `NextActionCard` avec CTA navigation

---

## 10. Stack Health

Calcule la couverture des connecteurs **recommandés pour ce projet** (pas les 30 globaux).

### 10.1 Connecteurs toujours recommandés

Stripe, Plausible, Google Ads, Brevo, Crisp

### 10.2 Mapping stack MVP (`mvpPlan.stack`)

| Pattern stack | Connecteur |
|---------------|------------|
| stripe | stripe |
| resend | resend |
| plausible | plausible |
| posthog | posthog |
| next.js / next.js 14 | vercel |
| supabase / tailwind | vercel |

### 10.3 Mapping canaux acquisition (`cacChannels`)

| Pattern canal | Connecteur |
|---------------|------------|
| cold email | brevo |
| linkedin | linkedin-ads |
| seo | plausible |
| google | google-ads |
| meta | meta-ads |
| referral | hubspot |

### 10.4 Sortie `StackHealth`

| Champ | Description |
|-------|-------------|
| `recommended` | Liste connecteurs attendus |
| `connected` | Sous-ensemble connecté (demo ou connected) |
| `missing` | Recommandés non connectés |
| `coveragePct` | % couverture |
| `nextRecommended` | Prochain à connecter (tri P0 > P1 > P2) |

---

## 11. Modèle de données

### 11.1 Intégration (`Integration`)

```typescript
{
  connectorId: ConnectorId;
  status: "demo" | "connected" | "disconnected";
  connectedAt?: string;
  lastSyncAt?: string;
  accountLabel?: string;      // ex. "Démo · DentalVoice"
  lastError?: string;         // futur : erreur sync API
  syncSchedule?: "manual" | "daily";
}
```

### 11.2 Types de streams

| Type | Champs | Connecteurs |
|------|--------|-------------|
| `payment` | failedPayments, recoveredPayments | Stripe, Paddle, Freemius |
| `finance` | cashBalance, monthlyInflow, monthlyOutflow, runwayDays | Qonto |
| `accounting` | revenueBooked, expensesBooked, vatDue | Pennylane, Abby |
| `product` | activationRate, retentionD7, featureUsageTop | PostHog, Mixpanel, Fathom |
| `support` | openTickets, avgResponseHours, csat | Crisp, Intercom, Zendesk |
| `dev` | deploysLast30d, openIssues, errorRate, uptimePct | GitHub, Vercel, Sentry, Better Stack |
| `crm` | pipelineValue, dealsWon, dealsLost, avgCycleDays | HubSpot, Pipedrive |
| `comms` | alertsSent, lastAlertAt | Slack |

Stockage : `project.connectorStreams[connectorId]`

### 11.3 Sync démo

À la connexion :
1. `syncConnectorDemo` → snapshots partiels (6 mois, PRNG seedé `{projectId}:{connectorId}`)
2. `syncConnectorStreamDemo` → stream si applicable
3. Merge dans `metricsHistory` + `connectorStreams`
4. Mise à jour `currentMrr` si snapshot MRR > 0

À la déconnexion : purge stream, statut `disconnected` (snapshots historiques conservés).

---

## 12. Catalogue des 30 connecteurs

Légende :
- **Mode** : `snapshots` = métriques mensuelles | `stream` = données dédiées | `both` = les deux
- **Priorité** : P0 = essentiel micro-SaaS FR | P1 = recommandé | P2 = complément
- **API réelle** : prévue (OAuth) — non implémentée aujourd’hui

---

### Encaisser (Paiements)

#### 1. Stripe — `stripe`

| Attribut | Valeur |
|----------|--------|
| Priorité | **P0** |
| Catégorie | payments |
| Mode | snapshots + stream `payment` |
| Impact cockpit | MRR réel vs projection fiche |
| Snapshots | mrr, newMrr, expansionMrr, churnedMrr, customers |
| Stream | failedPayments, recoveredPayments |
| API future | Stripe Billing API, webhooks `invoice.paid`, `customer.subscription.deleted` |
| Module cockpit | Revenus, Finance (vs compta) |

#### 2. Lemon Squeezy — `lemon-squeezy`

| Attribut | Valeur |
|----------|--------|
| Priorité | **P0** |
| Mode | snapshots |
| Snapshots | mrr, newMrr, churnedMrr, customers |
| API future | Lemon Squeezy API v1 (subscriptions, orders) |
| Usage | MoR EU, TVA gérée |

#### 3. Paddle — `paddle`

| Attribut | Valeur |
|----------|--------|
| Priorité | P1 |
| Mode | snapshots + stream `payment` |
| Snapshots | mrr, newMrr, churnedMrr, customers |
| API future | Paddle Billing API |

#### 4. Freemius — `freemius`

| Attribut | Valeur |
|----------|--------|
| Priorité | P2 |
| Mode | snapshots + stream `payment` |
| Snapshots | mrr, newMrr, customers |
| API future | Freemius SDK / REST API |
| Usage | Plugins WordPress, licences |

---

### Acquérir (Publicité)

#### 5. Google Ads — `google-ads`

| Attribut | Valeur |
|----------|--------|
| Priorité | **P0** |
| Mode | snapshots |
| Impact cockpit | ROAS vs budget acquisition fiche |
| Snapshots | adSpend, impressions, clicks, conversions |
| API future | Google Ads API (campaign performance) |
| Module cockpit | Acquisition |

#### 6. Meta Ads — `meta-ads`

| Priorité | P1 |
| Statut | **Implémenté** (OAuth + Marketing API v25.0) |
| Snapshots | adSpend, impressions, clicks, conversions (12 mois) |
| Routes | `/api/connectors/meta-ads/{oauth,callback,accounts,connect,sync,disconnect,health}` |
| Alertes | Token expiré / sync en échec / sync obsolète (> 30 j) via `integration-health` |
| Note token | Long-lived ~60 j ; données conservées si expiration ; reconnecter pour resync |

#### 7. LinkedIn Ads — `linkedin-ads`

| Priorité | P1 |
| Recommandé pour | B2B, LinkedIn outreach |
| Snapshots | adSpend, impressions, clicks, conversions |
| API future | LinkedIn Campaign Manager API |

#### 8. TikTok Ads — `tiktok-ads`

| Priorité | P2 |
| Snapshots | adSpend, impressions, clicks, conversions |
| API future | TikTok Marketing API |

#### 9. Microsoft Ads — `microsoft-ads`

| Priorité | P2 |
| Snapshots | adSpend, impressions, clicks, conversions |
| API future | Microsoft Advertising API (Bing) |

---

### Comprendre (Analytics)

#### 10. Plausible — `plausible`

| Priorité | **P0** |
| Snapshots | signups, activeUsers, mau, dau |
| API future | Plausible Stats API v2 |
| Usage | RGPD-friendly, stack Next.js |

#### 11. Google Analytics — `google-analytics`

| Priorité | P1 |
| Snapshots | signups, trials, activeUsers, mau, dau |
| API future | GA4 Data API |

#### 12. PostHog — `posthog`

| Priorité | P1 |
| Snapshots | signups, activeUsers, mau, dau |
| Stream | activationRate, retentionD7, featureUsageTop |
| API future | PostHog Query API, HogQL |

#### 13. Mixpanel — `mixpanel`

| Priorité | P2 |
| Snapshots | signups, activeUsers, mau |
| Stream | product (activation, rétention D7) |
| API future | Mixpanel Export / JQL API |

#### 14. Fathom — `fathom`

| Priorité | P2 |
| Snapshots | signups, activeUsers, mau, dau |
| Stream | product |
| API future | Fathom Analytics API |

---

### Convertir (Email)

#### 15. Brevo — `brevo`

| Priorité | **P0** |
| Recommandé pour | cold email, nurturing FR |
| Snapshots | signups, conversions |
| API future | Brevo API v3 (campaigns, contacts) |

#### 16. Resend — `resend`

| Priorité | P1 |
| Recommandé pour | stack Next.js (transactionnel) |
| Snapshots | signups, conversions |
| API future | Resend API (emails, domains) |

#### 17. Loops — `loops`

| Priorité | P2 |
| Snapshots | signups, conversions |
| API future | Loops.so API |
| Usage | Email marketing SaaS early-stage |

---

### Supporter (Support)

#### 18. Crisp — `crisp`

| Priorité | **P0** |
| Snapshots | activeUsers |
| Stream | openTickets, avgResponseHours, csat |
| API future | Crisp REST API (conversations, metrics) |

#### 19. Intercom — `intercom`

| Priorité | P1 |
| Snapshots | activeUsers |
| Stream | support |
| API future | Intercom API (tickets, CSAT) |

#### 20. Zendesk — `zendesk`

| Priorité | P2 |
| Snapshots | activeUsers |
| Stream | support |
| API future | Zendesk Support API |

---

### Comptabiliser FR (Finance & Compta)

#### 21. Qonto — `qonto`

| Priorité | P1 |
| Mode | stream `finance` uniquement |
| Impact cockpit | Runway réel vs estimé |
| Stream | cashBalance, monthlyInflow, monthlyOutflow, runwayDays |
| API future | Qonto API v2 (accounts, transactions) |
| Module cockpit | Finance |

#### 22. Pennylane — `pennylane`

| Priorité | P1 |
| Mode | stream `accounting` |
| Impact cockpit | CA comptable vs MRR Stripe |
| Stream | revenueBooked, expensesBooked, vatDue |
| API future | Pennylane API (factures, écritures) |

#### 23. Abby — `abby`

| Priorité | P1 |
| Recommandé pour | sync Stripe → compta indie FR |
| Stream | accounting (identique Pennylane) |
| API future | Abby.fr API / connecteur Stripe |

---

### Construire (Dev & Monitoring)

#### 24. GitHub — `github`

| Priorité | P1 |
| Stream | deploysLast30d, openIssues, errorRate, uptimePct |
| API future | GitHub REST API (commits, PRs, Actions) |
| Module cockpit | Build & Ship |

#### 25. Vercel — `vercel`

| Priorité | P1 |
| Recommandé pour | Next.js, Supabase stack |
| Stream | dev (deploys, uptime) |
| API future | Vercel API (deployments, usage) |

#### 26. Sentry — `sentry`

| Priorité | P1 |
| Stream | dev (errorRate élevé, issues) |
| API future | Sentry API (issues, release health) |
| Alertes | spike erreurs + corrélation churn |

#### 27. Better Stack — `better-stack`

| Priorité | P2 |
| Stream | dev (uptime, deploys) |
| API future | Better Stack Uptime API |
| Usage | Monitoring uptime + logs |

---

### Être alerté (Communication)

#### 28. Slack — `slack`

| Priorité | P1 |
| Stream | alertsSent, lastAlertAt |
| API future | Slack Incoming Webhooks / Bot API |
| Usage futur | Push alertes MRR, ROAS, churn dans canal fondateur |

---

### Vendre (CRM)

#### 29. HubSpot — `hubspot`

| Priorité | P1 |
| Recommandé pour | B2B, referral |
| Stream | pipelineValue, dealsWon, dealsLost, avgCycleDays |
| API future | HubSpot CRM API v3 |
| Module cockpit | Clients |

#### 30. Pipedrive — `pipedrive`

| Priorité | P2 |
| Stream | crm |
| API future | Pipedrive API v1 |
| Usage | CRM léger solo founder |

---

## 13. Streams par connecteur

Récapitulatif : quel connecteur produit quel stream à la sync démo.

| Connecteur | Stream type | Champs générés |
|------------|-------------|----------------|
| stripe, paddle, freemius | payment | failedPayments, recoveredPayments |
| qonto | finance | cashBalance, monthlyInflow, monthlyOutflow, runwayDays |
| pennylane, abby | accounting | revenueBooked, expensesBooked, vatDue |
| posthog, mixpanel, fathom | product | activationRate, retentionD7, featureUsageTop |
| crisp, intercom, zendesk | support | openTickets, avgResponseHours, csat |
| github | dev | deploysLast30d, openIssues, errorRate, uptimePct |
| vercel, better-stack | dev | deploysLast30d, openIssues, errorRate, uptimePct |
| sentry | dev | deploysLast30d, openIssues, errorRate (élevé), uptimePct |
| slack | comms | alertsSent, lastAlertAt |
| hubspot, pipedrive | crm | pipelineValue, dealsWon, dealsLost, avgCycleDays |
| lemon-squeezy, google-ads, meta-ads, etc. | — | snapshots uniquement |

---

## 14. Marketplace intégrations

### 14.1 Groupes (job labels)

1. **Encaisser** — Stripe, Lemon Squeezy, Paddle, Freemius
2. **Acquérir** — Google, Meta, LinkedIn, TikTok, Microsoft Ads
3. **Comprendre** — Plausible, GA4, PostHog, Mixpanel, Fathom
4. **Convertir** — Brevo, Resend, Loops
5. **Supporter** — Crisp, Intercom, Zendesk
6. **Comptabiliser (FR)** — Qonto, Pennylane, Abby
7. **Construire** — GitHub, Vercel, Sentry, Better Stack
8. **Être alerté** — Slack
9. **Vendre** — HubSpot, Pipedrive

### 14.2 Filtres UI

- Recherche full-text (nom + description)
- Filtre priorité : Tous | P0 | P1 | P2

### 14.3 Carte connecteur

Affiche : nom, catégorie, job, badge P0, badge Démo/Connecté, description, impact cockpit, métriques fournies, dernière sync, boutons Connecter / Sync / Déconnecter.

---

## 15. Architecture technique

### 15.1 Fichiers clés

| Chemin | Rôle |
|--------|------|
| `src/lib/connectors/registry.ts` | 30 connecteurs + métadonnées |
| `src/lib/connectors/types.ts` | Types ConnectorId, Integration, MetricsSnapshot |
| `src/lib/connectors/streams.ts` | Types streams |
| `src/lib/connectors/index.ts` | mergeSnapshots, syncConnectorAllDemo |
| `src/lib/connectors/sync.ts` | Stub `syncConnectorReal()` (OAuth futur) |
| `src/lib/connectors/demo/generators.ts` | Snapshots PRNG |
| `src/lib/connectors/demo/stream-generators.ts` | Streams PRNG |
| `src/lib/stack-health.ts` | Recommandations stack |
| `src/lib/radar-intelligence.ts` | Actions contextuelles |
| `src/lib/cockpit-metrics.ts` | KPIs dérivés |
| `src/lib/cockpit-alerts.ts` | Moteur alertes |
| `src/lib/cockpit-modules.ts` | Registre 9 modules |
| `src/hooks/use-cockpit-data.ts` | Agrégation cockpit |
| `src/contexts/portfolio-context.tsx` | État global + localStorage |
| `src/components/cockpit/cockpit-shell.tsx` | Layout Command Center |

### 15.2 Flux sync (mode démo actuel)

```
Utilisateur clique « Connecter (démo) »
        │
        ▼
connectIntegration(projectId, connectorId)
        │
        ├─► syncConnectorAllDemo()
        │       ├─ connector.demo(seed, 6 mois, targetMrr) → snapshots[]
        │       └─ generateStreamDemo() → stream | null
        │
        ├─► mergeSnapshots(metricsHistory, snapshots)
        ├─► mergeProjectStreams(connectorStreams, stream)
        └─► integrations[].status = "demo"
```

### 15.3 Priorités connecteurs

| Priorité | Connecteurs |
|----------|-------------|
| **P0** (6) | stripe, lemon-squeezy, google-ads, plausible, brevo, crisp |
| **P1** (16) | paddle, meta-ads, linkedin-ads, google-analytics, posthog, resend, intercom, qonto, pennylane, abby, github, vercel, sentry, slack, hubspot |
| **P2** (8) | freemius, tiktok-ads, microsoft-ads, mixpanel, fathom, loops, zendesk, better-stack, pipedrive |

---

## 16. Roadmap API réelles

### 16.1 Contrat prévu (`ConnectorSyncResult`)

```typescript
{
  snapshots?: MetricsSnapshot[];
  stream?: ConnectorStreamPayload;
  accountLabel?: string;
  syncedAt: string;
}
```

### 16.2 OAuth stub (`OAuthConfig`)

```typescript
{
  authUrl: string;
  scopes: string[];
  redirectUri: string;
}
```

Point d’extension unique : `syncConnectorReal()` dans `src/lib/connectors/sync.ts` (throw today).

### 16.3 Backend Supabase (TODO schema)

Tables prévues (commentaire dans `supabase/schema.sql`) :
- `user_projects`
- `integrations`
- `connector_snapshots`
- `oauth_tokens`

### 16.4 Routes API prévues

| Route | Rôle |
|-------|------|
| `GET /api/connectors` | Liste connecteurs + statut par projet |
| `POST /api/connectors/[id]/connect` | Initie OAuth |
| `GET /api/connectors/[id]/callback` | Callback OAuth |
| `POST /api/connectors/[id]/sync` | Sync manuelle / cron |
| `DELETE /api/connectors/[id]` | Révoque tokens |
| `POST /api/webhooks/[connectorId]` | Webhooks entrants (Stripe, etc.) |

### 16.5 Vagues d’implémentation API

| Vague | Connecteurs | Valeur |
|-------|-------------|--------|
| V1 | Stripe, Google Ads, Plausible, Brevo, Crisp | Revenus + acquisition + produit |
| V2 | PostHog, Qonto, GitHub, Sentry, Slack | Pilotage complet |
| V3 | Pennylane, Abby, HubSpot | Moat France + CRM B2B |

---

## Annexe — Matrice connecteur × module cockpit

| Connecteur | Overview | Revenus | Acquisition | Produit | Finance | Clients | Build | Intégrations |
|------------|:--------:|:-------:|:-------------:|:-------:|:-------:|:-------:|:-----:|:------------:|
| Stripe | ● | ●● | | | ● | | | ● |
| Lemon Squeezy | ● | ●● | | | | | | ● |
| Google Ads | ● | | ●● | | | | | ● |
| Meta Ads | ● | | ●● | | | | | ● |
| Plausible | ● | | | ●● | | | | ● |
| PostHog | ● | | | ●● | | | | ● |
| Brevo | ● | | ● | | | | | ● |
| Crisp | ● | | | | | ●● | | ● |
| Qonto | ● | | | | ●● | | | ● |
| Pennylane / Abby | ● | ● | | | ●● | | | ● |
| GitHub | ● | | | | | | ●● | ● |
| Sentry | ● | | | | | | ●● | ● |
| Vercel | ● | | | | | | ●● | ● |
| HubSpot / Pipedrive | ● | | | | | ●● | | ● |
| Slack | ● | | | | | | | ● |

Légende : ● = impact indirect | ●● = module principal

---

*Document généré pour SaaS Radar — dernière mise à jour : implémentation Command Center + 30 connecteurs démo.*
