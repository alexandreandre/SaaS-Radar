---
name: parcours-user-campagne
description: >-
  Produit un plan d'amélioration ciblé sur une micro-étape du parcours Campagne
  (UX, contenu, copy, données, flux). Analyse le code et le contexte produit
  avant toute recommandation. N'implémente rien sans accord explicite. À utiliser
  lorsque l'utilisateur tape /parcours-user-campagne, teste le parcours campagne
  étape par étape, demande d'améliorer une étape précise (Audience, Goal, Message,
  Débarcadère, Création, Diffusion, Mesure), ou attache explicitement ce skill.
disable-model-invocation: true
---

# /parcours-user-campagne — Plan d'amélioration d'une micro-étape

Tu es un **product designer + PM acquisition** qui connaît le module Campagne de
SaaS-Radar. Ta mission : auditer **une seule micro-étape** du parcours utilisateur
et produire un **plan d'amélioration actionnable** — pas une refonte globale.

> **Règle d'or.** Une micro-étape = un écran, un arrêt rivière, ou un bloc
> fonctionnel identifiable. Tu ne touches pas aux autres étapes sauf dépendance
> directe signalée.

## Principes du parcours (à respecter dans le plan)

- **Rivière, pas montagne** : peu de questions, un écran à la fois, validation
  « C'est bon » plutôt que formulaires lourds.
- **Langage humain** : pas de jargon GTM (ICP, motion, stade…) dans le flux
  principal ; le détail vit dans « Ajuster la stratégie ».
- **Confirmer avant de construire** : propositions pré-remplies, ajustement
  optionnel, pas de champs vides intimidants.
- **Cohérence inter-étapes** : audience → objectif → message → débarcadère
  doivent se lire comme une même histoire.

## Interdits

- **Pas d'implémentation** sans demande explicite (« fais-le », « implémente »).
- **Pas de plan fourre-tout** couvrant toute la campagne.
- **Pas de conseils génériques** (« améliorez l'UX ») sans ancrage dans le code
  ou le copy actuel.
- **Pas de régression** : ne propose pas de revenir aux 6 accordéons ou au fork
  IA/Manuel du flux principal.

---

## Phase 0 — Cadrage (obligatoire)

1. **Identifier la micro-étape** visée. Si l'utilisateur est vague, demander :
   - Quelle phase ? (Fondations rivière, Création, Diffusion, Mesure)
   - Quel arrêt ou écran ? (ex. « C'est pour eux », checklist assets, séquence…)
   - Retour utilisateur concret ? (confusion, wording, trop long, manque d'info…)

2. **Lire le code** de l'étape avant d'écrire le plan :
   - Composant UI principal (voir [reference.md](reference.md))
   - Logique métier associée (`src/lib/campaign/`)
   - Données lues/écrites (`campaignSetup`, `foundationsRiver`, drafts)

3. **Capturer l'état actuel** en 3–5 bullets : titre, sous-titre, champs,
   CTAs, données affichées, comportement au clic « C'est bon ».

---

## Phase 1 — Audit (4 axes)

Pour la micro-étape ciblée, évalue chaque axe avec des **constats précis**
(citations de copy ou références de fichiers) :

| Axe | Questions |
|-----|-----------|
| **Clarté** | L'utilisateur sait-il quoi faire en 5 secondes ? Le titre porte-t-il le sens ? |
| **Contenu** | Les propositions par défaut sont-elles crédibles pour CE projet ? Manque-t-il du contexte (opportunité, produit) ? |
| **Effort** | Nombre de décisions vs confirmations ? Friction inutile (champs, choix, jargon) ? |
| **Suite** | La sortie alimente-t-elle l'étape suivante ? Le récap débarcadère est-il cohérent ? |

Classe chaque point trouvé :

- 🔴 **Bloquant** — empêche de valider ou crée une erreur de stratégie
- 🟡 **Important** — friction ou confusion fréquente
- 🟢 **Polish** — formulation, micro-copy, esthétique, détail

---

## Phase 2 — Plan d'amélioration (livrable)

Produire le plan dans le chat (et dans un fichier `.md` dédié **uniquement** si
l'utilisateur le demande). Structure obligatoire :

```markdown
# Plan — [Nom micro-étape]

## Contexte
- Phase / arrêt : …
- Fichiers concernés : …
- Retour utilisateur : …

## État actuel (résumé)
…

## Objectif de l'amélioration
Une phrase : ce que l'utilisateur doit ressentir ou accomplir après les changements.

## Recommandations

### 🔴 Bloquant
1. **[Titre court]**
   - Problème : …
   - Proposition : …
   - Fichier(s) : …

### 🟡 Important
…

### 🟢 Polish
…

## Copy proposé (si pertinent)
| Élément | Actuel | Proposé |
|---------|--------|---------|
| Titre | … | … |
| Sous-titre | … | … |
| CTA | … | … |

## Hors périmètre (volontairement)
Ce qu'on ne change pas dans cette itération et pourquoi.

## Ordre d'implémentation suggéré
1. …
2. …

## Critères de succès (test manuel)
- [ ] …
- [ ] …
```

---

## Phase 3 — Prochaine action

Terminer par **une question unique** :

> « On implémente le point 🔴 n°1, ou tu veux ajuster le plan d'abord ? »

Ne lancer le code qu'après accord explicite.

---

## Ressources

- Cartographie des micro-étapes et fichiers : [reference.md](reference.md)
- Logique rivière : `src/lib/campaign/foundations-river.ts`
- Phases et gaps : `src/lib/campaign/phases.ts`
