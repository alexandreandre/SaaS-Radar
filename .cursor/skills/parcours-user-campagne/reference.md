# Cartographie — Parcours Campagne SaaS-Radar

## Phases macro (`CampaignPhaseId`)

| Phase | Écran | Fichier |
|-------|-------|---------|
| Fondations | `CampaignFoundationsScreen` | `campaign-foundations-screen.tsx` |
| Création | `CampaignCreationScreen` | `campaign-creation-screen.tsx` |
| Diffusion | `CampaignDiffusionScreen` | `campaign-diffusion-screen.tsx` |
| Mesure | `CampaignMeasureScreen` | `campaign-measure-screen.tsx` |

Orchestration : `campaign-workspace.tsx` · Stepper : `campaign-phase-stepper.tsx`

---

## Fondations — Parcours rivière

Orchestrateur : `campaign-foundations-river.tsx`  
Logique : `src/lib/campaign/foundations-river.ts`  
Persistance : `campaignSetup.foundationsRiver` + champs `icpSummary`, `smartGoal`, `positioning`

| Arrêt | ID | Titre UI | Composant |
|-------|-----|----------|-----------|
| Intro | `intro` | (dans orchestrateur) | `campaign-foundations-river.tsx` |
| Audience | `audience` | C'est pour eux | `campaign-foundations-river-stop-audience.tsx` |
| Objectif | `goal` | On vise ça | `campaign-foundations-river-stop-goal.tsx` |
| Message | `message` | On leur dit quoi | `campaign-foundations-river-stop-message.tsx` |
| Débarcadère | `dock` | C'est prêt | `campaign-foundations-river-dock.tsx` |

Shell commun (titre, CTA « C'est bon », Ajuster) : `campaign-river-stop-shell.tsx`  
Barre de progression : `campaign-river-progress.tsx`  
Panneau avancé (hors flux) : `campaign-river-advanced-sheet.tsx`

### Données par arrêt

| Arrêt | Draft / champs | Payload à confirmation |
|-------|----------------|------------------------|
| Audience | `who`, `pain` → `icpSummary` | `FoundationsRiverAudiencePayload` |
| Goal | `targetValue`, `channel`, `label`, `horizonDays` | `smartGoal` + `channel` |
| Message | `positioning` | `positioning` string |
| Dock | récap lecture seule | `completedAt` |

Recommandations initiales : `buildFoundationsRiverDraft()` dans `foundations-river.ts`  
Action portfolio : `confirmFoundationsRiverStop()` · types : `ConfirmFoundationsRiverPayload`

---

## Création

Écran : `campaign-creation-screen.tsx`

Micro-blocs typiques à auditer séparément :

| Bloc | Composant |
|------|-----------|
| Kit / message | `campaign-kit-section.tsx`, `campaign-message-card.tsx` |
| Checklist assets | `campaign-asset-checklist.tsx` |
| Gates infra | `campaign-infra-gates.tsx` |
| Gaps phase | `campaign-phase-gaps.tsx` |
| Recipe | `campaign-recipe-card.tsx` |

Logique assets : `src/lib/campaign/assets.ts`

---

## Diffusion

Écran : `campaign-diffusion-screen.tsx`

| Bloc | Composant |
|------|-----------|
| Séquence | `campaign-sequence-board.tsx` |
| Guide distribution | `campaign-distribution-guide.tsx` |
| Connecteurs | `campaign-connector-strip.tsx` |
| Action board | `campaign-action-board.tsx` |

---

## Mesure

Écran : `campaign-measure-screen.tsx`

| Bloc | Composant |
|------|-----------|
| Check-in hebdo | `campaign-weekly-checkin.tsx` |
| Métriques | `campaign-metrics-panel.tsx` |
| Rétrospective | `campaign-retrospective.tsx` |

---

## Chrome transversal (hors micro-étape sauf demande)

- Header campagne : `campaign-header.tsx` (readiness, semaine, blockers)
- Contrôles stade/canal : `campaign-controls.tsx`
- Guided step legacy : `campaign-guided-step.tsx`

Ne pas inclure dans un plan micro-étape sauf impact direct sur l'arrêt ciblé.

---

## Tests utiles

- Rivière : `scripts/campaign-foundations-river.test.ts`
- Phases / gaps : `scripts/campaign-phases.test.ts`
- Assets : `scripts/campaign-assets.test.ts`
