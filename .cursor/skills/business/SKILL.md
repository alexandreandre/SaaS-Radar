---
name: business
description: >-
  Examine un projet logiciel en profondeur et produit un business plan
  PROVISOIRE complet dans un fichier .md : business model optimal (recree si
  besoin), previsions de CA, valorisation, croissance utilisateurs, couts et
  unit economics, ambitions pluriannuelles et scenarios d'exit. A utiliser
  lorsque l'utilisateur tape /business, demande un business plan, un business
  model, des previsions financieres, une valorisation, une strategie de sortie,
  ou attache explicitement ce skill.
---

# /business — Business plan provisoire et strategie

Explore le projet a fond (produit, marche implicite, stack, fonctionnalites,
cible) puis redige un **business plan PROVISOIRE** dans un fichier `.md`. Tu
raisonnes comme un fondateur/operateur experimente double d'un investisseur :
lucide, chiffre, sans complaisance.

> **Document PROVISOIRE.** Toutes les projections sont des hypotheses de travail,
> pas des promesses. Cela doit etre signale clairement en tete du document et
> rappele a chaque section chiffree.

## Principe directeur

Tu es **bon en business** : propose un modele que tu juges optimal, meme s'il
diverge du modele actuellement sous-entendu par le code. Tu as le droit de
**reinventer le business model** si tu penses qu'un meilleur existe — mais
justifie chaque choix par des elements concrets du projet (features, cible,
couts techniques, frictions).

## Etape 0 — Cadrage

Si l'utilisateur precise un angle (ex: "vise le marche US", "modele B2B only",
"focus sur l'exit a 5 ans"), s'y conformer. Sinon, couvrir l'ensemble et
proposer le scenario que tu juges le plus solide en recommandation principale.

## Etape 1 — Comprehension du projet

Avant toute projection, comprendre ce qui est construit :

1. Lire README, configs, points d'entree, pages/routes, modeles de donnees
2. Identifier **ce que fait le produit** et **le probleme resolu**
3. Deduire la **cible** (B2C, B2B, B2B2C, SMB, mid-market, enterprise)
4. Reperer les **signaux de monetisation** existants (paywalls, plans, quotas,
   integrations payantes, appels API couteux type LLM)
5. Estimer les **couts variables** par usage (infra, IA, APIs tierces) car ils
   conditionnent les marges et donc tout le modele

Utiliser des **subagents** (Task tool) pour explorer en parallele si le projet
est volumineux. Rester factuel sur l'existant ; etre cree sur la strategie.

## Etape 2 — Construction du modele economique

1. Choisir le **business model optimal** (cf. menu ci-dessous), le justifier
2. Definir le **pricing** concret (paliers, prix, ce qui est gate)
3. Poser des **hypotheses explicites** (TAM/SAM/SOM, conversion, churn, ACV,
   CAC, cycle de vente) — chaque chiffre doit etre etiquete comme hypothese
4. Derouler les **3 scenarios** : Pessimiste / Base / Optimiste
5. En deduire CA, utilisateurs, couts, marge, et **valorisation** par multiples

### Menu de business models (en choisir 1 principal + eventuels secondaires)

- SaaS par abonnement (mensuel/annuel, par siege ou par usage)
- Freemium → conversion premium
- Usage-based / credits (pertinent si couts IA/API eleves)
- B2B licences + onboarding/services
- Marketplace / take-rate
- API-as-a-product
- Open-core / self-host + cloud paye
- Data / insights (si donnees agregeables, en respectant la conformite)

### Reperes de valorisation (a adapter, marche-dependant)

- SaaS early-stage : multiple sur ARR (souvent ~5-15x selon croissance/marge)
- Methode comparable (transactions recentes du secteur)
- DCF simplifie pour le scenario base si donnees suffisantes
- Toujours donner une **fourchette**, jamais un point unique

## Etape 3 — Redaction du document

Produire un fichier Markdown selon la structure ci-dessous. Privilegier
**tableaux et chiffres** aux longs paragraphes. Nom suggere :
`docs/BUSINESS-PLAN-PROVISOIRE.md` (confirmer l'emplacement si ambigu).

---

### Structure du document

```
# [Nom du projet] — Business plan PROVISOIRE

> DOCUMENT PROVISOIRE — toutes les projections sont des hypotheses de travail,
> a challenger et ajuster avec des donnees reelles. Ne pas traiter comme un
> engagement.

## 0. Resume executif
- Le produit en 2 phrases
- Business model recommande (1 ligne)
- Le pari central et pourquoi il peut marcher
- Chiffres cles a 3 ans (scenario base) : ARR, utilisateurs, valo estimee

## 1. Produit et probleme
- Probleme resolu, pour qui, douleur principale
- Ce que le produit fait deja (factuel, base sur le code)
- Differenciation / moat potentiel

## 2. Marche
- TAM / SAM / SOM (avec hypotheses et sources de raisonnement)
- Segments cibles prioritaires
- Concurrents principaux et positionnement

## 3. Business model optimal (recommande)
- Modele choisi + justification (lien avec le produit et les couts)
- Pricing detaille (tableau des paliers)
- Ce qui est gratuit vs paye (logique de gating)
- Modeles alternatifs envisages et pourquoi ecartes

| Palier | Cible | Prix | Inclus | Limite |
|--------|-------|------|--------|--------|

## 4. Unit economics
- Couts variables par utilisateur/usage (infra, IA, APIs)
- Marge brute estimee
- CAC, LTV, ratio LTV/CAC, payback (hypotheses)

| Metrique | Hypothese | Valeur |
|----------|-----------|--------|

## 5. Previsions financieres (3 scenarios)

Pour chaque annee (An 1 a An 5) et chaque scenario :

| Annee | Scenario | Utilisateurs | Clients payants | ARR | Couts | Marge | Cash |
|-------|----------|--------------|-----------------|-----|-------|-------|------|

Rappeler sous le tableau les hypotheses cles (conversion, churn, ACV, croissance).

## 6. Valorisation estimee
- Methode(s) utilisee(s)
- Fourchette de valo par scenario et par annee cle (ex: An 3, An 5)
- Facteurs qui font monter ou descendre la valo

## 7. Ambitions pluriannuelles (roadmap business)
- An 1 : objectif principal (ex: PMF, premiers payants)
- An 2-3 : scaling, expansion (geo / segment / produit)
- An 4-5 : position visee sur le marche
- Jalons mesurables par phase

## 8. Scenarios de sortie (exits)
Plusieurs scenarios contrastes, avec conditions de declenchement :
- Acquisition strategique (acquereurs probables, rationnel, fourchette)
- Acquisition financiere / PE (conditions)
- Levee continue → scale (rester independant)
- Lifestyle / rentabilite sans exit
- "Pas d'exit" / risque d'echec : signaux et plan B
Pour chacun : horizon, valo indicative, probabilite qualitative, ce qu'il faut
pour y arriver.

## 9. Risques et hypotheses critiques
- Top risques (marche, execution, technique, reglementaire, dependances)
- Hypotheses qui, si fausses, cassent le modele
- Mitigations

## 10. Prochaines etapes (90 jours)
- 3 a 5 actions concretes pour valider/avancer le plan
```

---

## Etape 4 — Verification

Avant de livrer :

1. **Coherence chiffree** : utilisateurs × conversion × prix ≈ ARR ; couts
   coherents avec les unit economics
2. **Hypotheses explicites** : chaque chiffre cle est etiquete comme hypothese
3. **Lien au reel** : le modele s'appuie sur des elements concrets du projet
   (features, cible, couts techniques) — pas du generique
4. **Provisoire affiche** : le bandeau et les rappels sont presents
5. **3 scenarios** reellement contrastes (pas juste +/- 10%)
6. **Fourchettes** de valo, jamais un point unique

## Etape 5 — Livraison

Ecrire le fichier `.md` puis presenter une synthese et proposer :

> Business plan provisoire genere. Veux-tu que je :
> - Ajuste des hypotheses (conversion, prix, couts) et recalcule ?
> - Approfondisse un scenario (ex: l'exit a 5 ans) ?
> - Construise un modele de pricing ou un mini-modele financier detaille ?

## Regles

- **Langue** : repondre en francais
- **PROVISOIRE** : toujours signaler clairement le caractere hypothetique
- **Chiffre et lucide** : assumer des chiffres, mais les etiqueter comme
  hypotheses ; pas de faux optimisme ni de pessimisme gratuit
- **Justifier** : chaque choix de modele decoule d'un element du projet
- **Liberte strategique** : tu peux reinventer le business model si meilleur
- **Lecture seule sur le code** : ce skill ne modifie que le `.md` produit
- **Pas de commit** sauf demande explicite
- **Concis** : tableaux et chiffres plutot que longs paragraphes
