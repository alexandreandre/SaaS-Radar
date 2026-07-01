# SaaS Radar — Architecture du moteur de sourcing (adaptée au système réel)

**Blueprint de référence · v2.0 · 1er juillet 2026**

> Ce document décrit l'architecture cible du « robot de sourcing » de SaaS Radar : découvrir des
> SaaS étrangers, vérifier qu'ils marchent, estimer leur traction, détecter un concurrent français,
> évaluer la clonabilité, classer les opportunités — et livrer un dossier hebdomadaire.
>
> **Différence avec la v1.0 (conçue à l'aveugle).** La v1.0 supposait une page blanche et
> recommandait un « MVP concierge, ~0 code ». **C'est caduc : SaaS Radar a déjà un pipeline
> automatisé mûr.** Cette v2.0 part du code réel (`src/lib/sourcing/*`, `src/lib/scoring/*`,
> `supabase/migrations/*`) et mappe chaque idée d'architecture sur l'existant : ce qui est **déjà
> construit** ✅, ce qui est **à faire évoluer** 🔧, ce qui est **nouveau** ✨.
>
> Certitudes techniques externes : `[VÉRIFIÉ 2026]` · `[STABLE]` · `[HYPOTHÈSE]`. La partie légale
> (§14) doit être validée par un conseil — je ne suis pas avocat.

---

## 0. Réconciliation : ce que vous avez déjà (à lire en premier)

L'erreur à éviter serait de « repartir de zéro » alors que 60 % de l'architecture idéale **existe
déjà**. Cartographie honnête avant tout :

| Concept de l'architecture idéale | Statut réel dans le repo |
|---|---|
| Cadence hebdo + « editor's pick » | ✅ `manageWeeklyPick` + `weekly_pick` ([run.ts:213](src/lib/sourcing/run.ts#L213)) + newsletter hebdo |
| Gate humain éditorial (backstop fiabilité) | ✅ `opportunity_drafts` + routage `draft/direct/auto` ([lead-routing.ts](src/lib/sourcing/lead-routing.ts)) + cockpit admin |
| Agent « Architecte » (plan de rebuild 30 j) | ✅ [structure.ts](src/lib/sourcing/structure.ts) → `roadmap`, `stackGuide`, `buildPrompts` |
| Fit France + espace concurrentiel | 🔧 existe en **score LLM** (`franceFit`, `competitionGap`, `franceFitCriteria`) — mais *asserté*, pas *web-sourcé* |
| Découverte | 🔧 existe mais **mono-source** : Perplexity Sonar Pro seul ([discover.ts](src/lib/sourcing/discover.ts)) |
| Vérification / critique | 🔧 [verify-sources.ts](src/lib/sourcing/verify-sources.ts) + [verify-facts.ts](src/lib/sourcing/verify-facts.ts) — briques d'un futur agent critique, pas encore adversariales |
| Dédup déterministe | ✅ [sourcing-dedup](src/lib/admin/sourcing-dedup.shared.ts) (domaine/URL) — 🔧 à étendre (favicon/trigram) |
| Cost-guard / budget par run | ✅ [cost-guard.ts](src/lib/sourcing/cost-guard.ts) + `maxCostUsd` |
| Observabilité / métriques | ✅ [metrics.ts](src/lib/sourcing/metrics.ts) + `sourcing_runs` + `sourcing_metrics_daily` |
| Provenance **par champ** | 🔧 partielle (`sourceUrl` sur signaux) → ✨ à formaliser |
| Estimation en fourchette + confiance | ✨ absent — aujourd'hui MRR *asserté* par le LLM |
| Estimation = **classement**, pas publication | ✨ nouveau principe (voir §9) |
| Volant de calibration (mesure de l'erreur) | ✨ nouveau — dépend de mois de données |
| Reranker appris du goût éditorial | ✨ nouveau — la donnée existe déjà dans `opportunity_drafts` |
| Multi-source + expansion par graphe | ✨ nouveau |

**Conclusion : ce n'est pas un chantier de reconstruction, c'est un chantier de *comblement de
lacunes ciblées*.** Les deux lacunes qui comptent : (1) la découverte est aveuglément confiée à un
seul LLM qui *invente aussi les chiffres* ; (2) rien ne distingue « estimé pour classer » de
« publié comme fait ». Tout le reste est du raffinement de l'existant.

---

## 1. Résumé exécutif

Cinq décisions structurantes.

1. **Ce n'est pas un annuaire, c'est un produit éditorial hebdomadaire.** Les concurrents (TrustMRR
   ~840, Kojify 100 k+, Proven SaaS ~14 500) sont des *bases* vendues à l'accès, optimisées pour la
   couverture. SaaS Radar produit **~1 dossier profond/semaine**. Cette cadence inverse toute
   l'économie — et c'est déjà votre modèle (`weekly_pick` + newsletter).

2. **L'architecture est un entonnoir, pas une base.** Découverte large et bon marché → filtrage
   progressif → poignée de finalistes → dossier profond sur *un* gagnant. Votre `run.ts` est déjà un
   entonnoir ; on l'élargit en haut (multi-source) et on le durcit au milieu (estimation-classement
   + critique).

3. **L'estimation sert d'abord au classement interne, pas à la publication.** C'est LA correction
   clé vs votre code actuel : aujourd'hui le MRR *asserté* par Sonar peut finir affiché. Demain, une
   estimation (Monte-Carlo compris) décide seulement *quel candidat mérite l'heure d'un humain* ;
   seuls des faits sourcés ou des fourchettes honnêtes atteignent la publication.

4. **La fiabilité est un problème résoluble ici — pas chez eux.** À ~1 publication/semaine, on
   impose : *aucun chiffre publié qui ne soit sourcé-et-cité, ou affiché comme estimation
   fourchette+méthode+confiance*, avec **un humain qui valide** (vous l'avez déjà via les drafts).
   « Honnête par construction » = garantie produit **et** moat.

5. **On fait évoluer, on ne reconstruit pas.** Le volant d'apprentissage (calibration, reranker)
   s'allume *progressivement*, quand la donnée s'accumule. Ne jamais le faire tourner à vide — ce
   serait fabriquer de la fausse intelligence, le péché des concurrents.

---

## 2. Principe directeur

**Un annuaire vit de la couverture ; un produit de curation vit de la justesse d'un choix par
semaine.** Confondre les deux est l'erreur la plus coûteuse.

- **L'économie s'inverse.** Un annuaire dépense 0,05–0,50 € de compute/fiche. Vous produisez
  ~52 dossiers/an : vous pouvez dépenser **plusieurs dizaines d'euros + ~1 h d'humain par
  finaliste** sans casser l'économie. C'est ce qui vous permet d'être *plus* fiable qu'eux, pas moins.
- **« Données insuffisantes » est un résultat de première classe.** Un candidat non caractérisable
  honnêtement n'est pas publié ; il suffit d'un item/semaine, donc on retombe sur le suivant plutôt
  que d'inventer. C'est déjà la logique de votre routage `draft` — on la rend explicite comme
  *valeur*, pas comme *échec*.
- **Détecter « un concurrent français existe-t-il ? » n'est pas d'abord un problème de registre.**
  Un registre (Pappers/INPI) liste des *sociétés*, pas des *produits*. Un clone FR précoce peut être
  un site sans société distincte. La détection est avant tout **recherche web francophone + veille
  produit (Product Hunt/BetaList FR)** ; le registre confirme.

**Thèse d'intelligence.** « Intelligent » ne peut pas vouloir dire « devine mieux » — un robot qui
invente un MRR brillant est inutile. Ici, intelligent = **raisonne sur ce qu'il faut investiguer, se
contredit lui-même avant de publier, et apprend de ses erreurs passées.** L'intelligence et
l'honnêteté sont le *même* système.

---

## 3. Vue d'ensemble — l'entonnoir agentique

Essaim d'agents *grounded* (chaque affirmation attachée à sa preuve), en entonnoir, piloté par un
orchestrateur, nourri par une mémoire qui se calibre. Le coût et le jugement montent en descendant ;
la largeur diminue. Les ✅ marquent ce qui existe déjà dans `run.ts`.

```
                    ┌────────────────────────────────────────────┐
                    │  MÉMOIRE & CALIBRATION (le volant)  ✨       │
                    │  sourcing_runs ✅ · drafts ✅ · calibration ✨│
                    └──────────────┬─────────────────────────────┘
                                   │ informe        ▲ apprend
                                   ▼                │
┌──────────────────────────────────────────────────┴──────────────────┐
│  ÉTAGE 1 — DÉCOUVERTE (large, bon marché)                            │
│  Sonar (web) ✅  +  Product Hunt API ✨  +  seeds curateur ✨          │
│  + expansion par graphe (un SaaS → ses concurrents) ✨                │
└───────────────┬───────────────────────────────────────────────────────┘
                │  dédup déterministe ✅ (→ étendre favicon/trigram 🔧)
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│  ÉTAGE 2 — PRÉ-TRI (LLM léger + règles)                                │
│  classification niche/B2B-B2C ✅(Gemini) · « vrai micro-SaaS ? » ✅     │
└───────────────┬───────────────────────────────────────────────────────┘
                │  score de classement ✅ (previewOpportunityScore) + reranker ✨
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│  ÉTAGE 3 — SHORTLIST (top N ≈ 5–15/sem) · sourcing actif               │
│  agents : [Recherche] [Estimation ✨] [Fit France 🔧] [Architecte ✅]   │
│  enrichissement ciblé ✅(enrichTraction) · triangulation ✨ · provenance ✨│
└───────────────┬───────────────────────────────────────────────────────┘
                │  fan-in
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│  AGENT CRITIQUE (red team) 🔧 — falsifie chaque affirmation            │
│  (évolution de verify-sources ✅ + verify-facts ✅ vers l'adversarial)  │
└───────────────┬───────────────────────────────────────────────────────┘
                ▼
┌───────────────────────────────────────────────────────────────────────┐
│  COCKPIT HUMAIN ✅ — valide, édite, approuve (drafts → publish)         │
└───────────────┬───────────────────────────────────────────────────────┘
                ▼
        ┌───────────────────┐
        │  DOSSIER PUBLIÉ ✅ │  ── résultats/issues ──► remontent vers la MÉMOIRE ✨
        └───────────────────┘
```

---

## 4. Les étages et les agents (nature + mapping code)

Nature (**code** / **LLM** / **humain**), rôle, et où ça vit dans le repo.

### Découverte & scouts — *code + LLM* · 🔧
Aujourd'hui : un seul scout, Sonar Pro ([discover.ts](src/lib/sourcing/discover.ts)). **Sonar reste
un excellent scout de raisonnement web — on le garde, on le rétrograde.** On ajoute des sources
*indépendantes* (Product Hunt API, seeds curateur) et l'**expansion par graphe** (d'un SaaS, remonter
ses concurrents). *Pourquoi la diversité :* échapper au biais « niches connues de Sonar » **et** créer
la condition de la corroboration (§11). *Pourquoi code :* ingestion API et normalisation déterministes.

### Dédup / normalisation — *code* · ✅→🔧
Existe ([sourcing-dedup.shared.ts](src/lib/admin/sourcing-dedup.shared.ts)) sur domaine/URL. À étendre
en cascade `favicon hash → trigram nom → embeddings (finalistes) → revue humaine`, car plusieurs
scouts remonteront le **même** produit : il faut fusionner candidats *et* provenances.

### Orchestrateur — *code-first + LLM en appoint* · 🔧
Aujourd'hui : la boucle procédurale de [run.ts](src/lib/sourcing/run.ts). Demain : elle applique la
**valeur d'information** (§5) — ne dépenser un signal coûteux que s'il peut changer le classement.
*Choix d'ingénierie important :* l'arbitrage « où chercher » est un problème de *bandit*
(déterministe, traçable), **pas** un agent LLM chef d'orchestre. Le LLM ne sert qu'à *proposer* de
nouvelles niches à explorer (créativité combinatoire) ; le code *dispose* (budgets, quotas).

### Agent Recherche — *LLM outillé* · ✨ (partiel via enrichTraction ✅)
Rassemble les preuves multi-sources d'un finaliste et les **croise** (triangulation). Sortie : faits
structurés, chacun avec sa source. Garde-fou déjà présent dans vos prompts : jamais un fait sans URL.

### Agent Estimation — *code (formules) + LLM (classification)* · ✨
Math déterministe (midpoint géométrique, Monte-Carlo, garde-fous d'absurdité, §9). Le LLM ne fait que
*classer le business model* (qui choisit les paramètres). Sortie : `low/median/high` + confiance +
hypothèses. **Nouveau vs `checkMrrSanity` actuel** ([assemble.ts]) qui ne fait qu'un contrôle de
cohérence. *Rejouable et explicable.*

### Agent Fit France — *LLM + code* · 🔧 (le moat sous-développé)
Aujourd'hui : `franceFit`/`competitionGap` sont des **jugements LLM non sourcés**. Demain : le code
lance des **recherches web FR** (le problème + « [catégorie] logiciel français » + annuaires/PH FR),
le LLM juge si chaque résultat est un concurrent direct/adjacent/bruit, Pappers/INPI confirme
l'entité. Sortie : `concurrence_FR ∈ {none,low,medium,high}` **avec les URLs FR en preuve**. C'est le
signal le plus différenciant *et* le plus faisable — à prioriser (§13, Phase 1).

### Agent Architecte — *LLM outillé* · ✅
**Déjà construit** : [structure.ts](src/lib/sourcing/structure.ts) produit `roadmap` 30 j, `stackGuide`,
`buildPrompts`. On l'enrichit d'un léger reverse-engineering de stack (Firecrawl) pour ancrer la
complexité de build sur du réel plutôt que sur une estimation.

### Agent critique (red team) — *LLM adversarial* · 🔧
Le composant le plus important. Vos [verify-sources.ts](src/lib/sourcing/verify-sources.ts) (URLs
joignables) et [verify-facts.ts](src/lib/sourcing/verify-facts.ts) (fact-check) en sont les briques —
mais ils *valident*, ils ne *cherchent pas à réfuter*. Évolution : un agent qui tente activement de
**falsifier** — « ce chiffre est-il sourcé ou inventé ? », « a-t-on raté un concurrent FR trouvable en
30 s ? », « le plan 30 j tient-il ? ». Toute affirmation qui ne survit pas est dégradée ou retirée.

### Cockpit humain — *humain* · ✅
**Déjà là** : drafts + routage + admin. C'est le rempart ultime contre le « chiffre inventé présenté
comme un fait », *abordable grâce à la cadence hebdo*. L'avantage décisif sur les concurrents. Ses
décisions renourrissent le volant (§5).

---

## 5. Les mécanismes d'intelligence

Ce qui distingue ce moteur d'une simple automatisation. Chacun est concret, pas décoratif — et
étiqueté selon sa faisabilité *maintenant* vs *quand la donnée existe*.

- **Sourcing actif par valeur d'information** *(faisable Phase 2)*. L'orchestrateur ne dépense un
  signal coûteux (crawl profond, trafic, vérif pub) sur un candidat *que si ce signal peut changer le
  classement*. Les gagnants/perdants évidents ne consomment rien. Généralise votre `cost-guard`.
- **Triangulation & détection de contradiction** *(faisable Phase 2)*. Chaque fait vient de plusieurs
  sources ; on **quantifie le désaccord**. Un pricing crawlé incompatible avec l'activité observée
  n'est pas à moyenner : c'est un *signal d'alerte* qui fait chuter la confiance. La contradiction
  devient information.
- **Agent critique adversarial** *(Phase 2)*. Le moteur d'honnêteté (§4).
- **Volant de calibration — le vrai game-changer** *(Phase 3, dépend de données)*. Le moteur
  enregistre chaque estimation ; quand la vérité se révèle (rachat à multiple connu, MRR publié par un
  fondateur), il **compare sa prédiction à la réalité** (score de Brier sur ses niveaux de confiance)
  et recalibre. « Confiance 0,7 » finit par *vraiment* dire 70 %. *Réalisme :* les révélations sont
  rares pour des micro-SaaS obscurs → le volant se remplit lentement ; ne pas le simuler à vide.
- **Reranker appris du goût éditorial** *(Phase 3, données déjà disponibles)*. Le score reste
  déterministe (auditable) ; une couche apprise s'y ajoute à partir des picks que l'humain
  choisit/rejette **et de ses raisons** — donnée que vous accumulez *déjà* dans `opportunity_drafts`.
  La shortlist devient « à ton goût » semaine après semaine.
- **Suivi des issues des picks passés — le moat propriétaire** *(Phase 3)*. Après publication : un
  clone FR est-il apparu ? des lecteurs ont-ils réussi ? Donnée d'*issue* qui n'existe nulle part
  ailleurs — crédibilité (« nos picks 2025, voici ce qu'ils sont devenus ») + carburant du modèle.
- **Détection de niches émergentes** *(Phase 3)*. Clustering d'embeddings + vélocité (nouveaux
  entrants, activité pub, demande de recherche) → repérer une niche qui *chauffe*.
- **Détection de géo-arbitrage — le signal cœur** *(Phase 1-2)*. « Marche fort aux US/DE, absent en
  France » calculé, pas deviné. C'est votre proposition de valeur, dérivée par le moteur.
- **Le jumeau numérique du solo-founder français** *(Phase 2-3)*. Un agent-persona simule le lecteur :
  *ce SaaS-là, ce solo pourrait-il le construire et le vendre en France en 30 j ?* Transforme « bon
  SaaS étranger » en « bonne opportunité pour toi ».
- **Auto-évaluation (eval harness)** *(transverse)*. Le système note ses sorties passées (l'estimation
  est-elle tombée dans la fourchette ? le Fit France a-t-il manqué un concurrent trouvé plus tard ?) ;
  prompts et poids versionnés (`model_version`, déjà présent dans votre scoring).

---

## 6. Le substrat de mémoire

Quatre couches. Ce qui existe est marqué ✅.

1. **Observabilité des runs** ✅ — `sourcing_runs`, `sourcing_metrics_daily`, `opportunity_drafts`.
   C'est déjà une mémoire opérationnelle ; on la relie au volant.
2. **Graphe de connaissances** ✨ — entités (produits, fondateurs, niches, concurrents, marchés) +
   arêtes (concurrence, géo-arbitrage). Alimente l'expansion par graphe.
3. **Index vectoriel** ✨ (pgvector, *Phase 3*) — similarité produit, clustering, émergence.
4. **Magasin de calibration** ✨ — paires `estimation → réalité révélée`, base du volant (§5).
5. **Registre de provenance append-only** ✨ — *chaque* affirmation pointe vers
   `(source, url, méthode, date, payload brut)`. Rien d'affichable sans provenance : la règle qui rend
   la sophistication compatible avec la défendabilité juridique.

---

## 7. Sources de données

Statut légal et coûts **vérifiés par recherche web, 2026.**

### Indispensables (gratuites/peu chères, propres, à fort apport)

| Source | Apport | Statut 2026 | Coût | Dans le repo |
|---|---|---|---|---|
| **Perplexity Sonar Pro** (web reasoning) | Découverte, raisonnement | En place, via OpenRouter | $$ | ✅ à garder comme *un* scout |
| **Product Hunt API v2 (GraphQL)** | Découverte de lancements | `[VÉRIFIÉ 2026]` Active, token requis. **Usage commercial soumis à accord préalable**. Makers/handles **expurgés** (bon RGPD). Rate-limité | Gratuit | ✨ P1 |
| **Recherche web + seeds humains** | Découverte, veille indie | Légitime, quasi gratuit ; à 52/an souvent > l'automatisation | ~0 € | ✨ |
| **Firecrawl** (crawl/enrichissement) | Pricing, stack, contenu | `[VÉRIFIÉ 2026]` Gratuit 1 000 pages/mois ; Hobby ~16 $/mois ; 1 crédit = 1 page. À faible volume, le gratuit suffit | 0–16 $ | ✨ P2 |
| **LLM (Claude / Gemini)** | Extraction, classif, synthèse, agents | Principal coût récurrent, modeste au volume | variable | ✅ Gemini en place |
| **Recherche web FR** (primaire) | Détection concurrent & marché FR | Légal (contenu public) | ~0 € | 🔧 P1 (le moat) |
| **Pappers / INPI API** (secondaire) | Confirmation d'entité FR | `[VÉRIFIÉ 2026]` Open data (INSEE/SIRENE, INPI/RCS, BODACC), MAJ quotidienne. **100 crédits gratuits** à l'ouverture, puis forfaits. *Société*, pas *produit* | 0 € au départ | ✨ P1 |

### Optionnelles — réservées aux finalistes, à NE PAS industrialiser

- **Meta Ad Library — traction, vérif manuelle.** `[VÉRIFIÉ 2026]` L'API `/ads_archive` **ne rend pas
  la plupart des pubs commerciales** (politiques/enjeux + catégories US). *Nuance :* l'**UI web**
  affiche une fourchette d'impressions pour toutes les pubs, et l'API rend davantage pour les pubs
  **diffusées dans l'UE (DSA)**. **Reco : pas de pipeline d'ads** ; pour une poignée de finalistes, un
  humain consulte l'UI (légal). Scraper l'UI à l'échelle viole les conditions Meta (*Meta v. Bright
  Data*). *NB : vous avez un connecteur `meta_ads` (migration 019) — c'est pour le **cockpit client**
  (le SaaS de l'utilisateur), pas pour le sourcing ; ne pas confondre les deux usages.*
- **Estimation de trafic — DataForSEO (pay-as-you-go)** ou Google Trends, finalistes seulement, signal
  faible et corroborant. Pas d'Ahrefs/Semrush au départ.
- **App stores** — seulement si le candidat est une app ; pages publiques, basse fréquence.
- **MRR auto-déclaré** — IndieHackers / X / interviews ; signal *self-reported* de forte valeur de
  calibration (poids fort si récent+daté), à taguer comme tel.

### À éviter comme source

- **Reddit via l'API officielle.** `[VÉRIFIÉ 2026]` Tier gratuit **non-commercial** (100 req/min) ;
  commercial via contrat entreprise **~12 000 $/an min**, revue de plusieurs semaines. Prohibitif et
  inutile à cette cadence. Un signal de demande se prend en consultation publique ponctuelle.
- **Les bases des concurrents** (TrustMRR/Kojify/Proven/Crunchbase). Interdit d'en ré-extraire une
  partie substantielle (droit *sui generis*, §14). Reconstruire depuis les sources d'origine.

---

## 8. Modèle de données

**On ne refait pas `opportunities` / `opportunity_drafts` / `sourcing_runs`** (migrations 001–036).
On ajoute des tables satellites (prochaine migration `037_sourcing_provenance.sql` ou suite). Postgres
(Supabase), provenance d'abord, append-only pour l'historique.

```sql
-- Pool de candidats (large, avant structuration) — nourrit l'entonnoir amont
sourcing_candidates (
  id uuid pk, run_id uuid,             -- ↔ sourcing_runs ✅
  name text, domain text, source text, -- sonar|product_hunt|graph|seed
  discovered_at timestamptz, category text,
  funnel_status text,   -- discovered/screened/shortlisted/rejected/published
  merged_into uuid,     -- fusion multi-source (dédup)
  rank_score numeric
)

-- Signaux (append-only : on n'écrase jamais → historique natif)
sourcing_signals (
  id uuid pk, candidate_id fk, signal_type text,  -- pricing, traffic, ad_activity, review_velocity, mrr_declared…
  value jsonb,
  status text,          -- verified/self_reported/estimated/weak/unknown
  confidence numeric,   -- 0..1 calibré (§5,§9)
  source text, url text, method text,             -- api/crawl/provider/manual
  captured_at timestamptz, raw jsonb
)

-- Provenance PAR CHAMP des fiches publiées (loi de défendabilité)
opportunity_field_sources (
  id uuid pk, opportunity_id uuid,     -- ou draft_id
  field text,                          -- mrr|france_competition|pricing|traffic…
  source text, url text, method text,
  verdict text,                        -- corroborated|single_source|unverified|contradicted
  fetched_at timestamptz
)

-- Estimations (traçabilité totale — sert au CLASSEMENT, §9)
sourcing_estimates (
  id uuid pk, candidate_id fk, metric text,       -- mrr, revenue…
  low numeric, median numeric, high numeric,
  method text, model_version text, confidence numeric,
  assumptions jsonb, computed_at timestamptz
)

-- Marché français (le moat)
sourcing_french_market (
  candidate_id fk, search_demand jsonb,
  competitors jsonb,        -- produits FR concurrents (URLs, web FR)
  registry_matches jsonb,   -- Pappers/INPI (confirmation)
  openness text, assessed_at timestamptz
)

-- Substrat de mémoire / volant
sourcing_calibration (id, estimate_id fk, revealed_value numeric, revealed_at timestamptz, source text)
sourcing_outcomes    (opportunity_id fk, kind, detail jsonb, observed_at)  -- clone FR apparu ? lecteur réussi ?
kg_nodes (id, kind, ref_id, attrs jsonb)     -- graphe (Phase 3)
kg_edges (src, dst, relation, weight)        -- concurrence, geo_arbitrage
```

Ajouts non destructifs au type [Opportunity](src/types/opportunity.ts) : `revenueEstimate?:
{low;median;high;confidence}`, `dataQuality?: number`, `geoArbitrage?: number` — tous optionnels
(fiches legacy intactes).

**Règles.** Rien d'affichable sans provenance. `sourcing_signals`/`*_snapshots` append-only. pgvector
en Phase 3, pas au départ.

---

## 9. Estimation — et la résolution du débat Monte-Carlo

**Principe qui change tout : ici, l'estimation *classe*, elle ne se *vend* pas.** Chez les
concurrents, le chiffre MRR *est* le produit (d'où « 1,2 M$ » sorti d'une fourchette d'impressions).
Ici, une estimation décide seulement *quel candidat mérite le temps d'un humain cette semaine*.

**Ce que ça règle (et pourquoi Monte-Carlo revient — tu avais raison).**

> Pour *classer en interne*, une entrée imparfaite est **tolérable** : au pire on investigue un
> candidat un peu moins bon, l'humain corrige. Donc **Monte-Carlo est le bon outil dès qu'on a une
> quantité mesurée à propager** (trafic, downloads, reach). Il produit une distribution honnête
> (P10/P50/P90) qui *ordonne* la shortlist. **Mais rien de ce que MC produit n'est publié comme
> fait.** La publication n'affiche que des faits sourcés-et-cités, ou une fourchette explicitement
> étiquetée « estimé » avec méthode + confiance. MC alimente le tri ; l'humain + la provenance
> gardent la publication.

**Signaux d'entrée, par fiabilité :** (1) chiffre public auto-déclaré récent+daté ★★★ ; (2) listing
marketplace (Acquire/Flippa) ★★★ ; (3) pricing crawlé × proxy d'audience × conversion-benchmark ★–★★ ;
(4) vélocité d'avis × prix ★★ ; (5) activité pub comme proxy ★.

**Sortie toujours en fourchette :**
```
proxy mesuré → distribution log-normale sur [low, high]  (midpoint géométrique √(low×high))
Monte-Carlo sur proxy × prix/CPM × conversion/ROAS × multiplicateur-canal → P10 / P50 / P90
confidence = f( largeur (P90−P10)/P50, nb de sources concordantes, fraîcheur )
```
Le midpoint **géométrique** corrige le biais du midpoint arithmétique (les reach suivent une
log-normale, la masse est près du bas du bucket).

**Garde-fous d'absurdité** (généralisent votre `checkMrrSanity` ✅) : si `revenu > seuil ×
plausibilité` (vs effectif estimé) ou `clients impliqués > trafic mensuel` → **rabattre + marquer
« données insuffisantes »** plutôt que publier.

**Manque de données** (cas nominal d'un micro-SaaS obscur), trois issues honnêtes dans l'ordre :
(1) fourchette large + confiance basse + méthode visible ; (2) faits sourcés seulement (« pub active
depuis 8 mois », « 340 avis App Store ») sans dériver de revenu ; (3) ne pas publier ce candidat cette
semaine. **Jamais un chiffre sec.**

---

## 10. Scoring & classement

Le score optimise une seule question : *« serait-ce un excellent pick hebdo pour un solo-founder
français ? »* On **garde vos 4 sous-scores** ([rubric.ts](src/lib/scoring/rubric.ts)) et on ajoute
deux axes + le reranker (§5).

| Axe | Description | Statut |
|---|---|---|
| **franceFit** — le problème existe en FR, culture d'achat, réglementation | ✅ (à *web-sourcer*, §4) |
| **competitionGap** — espace concurrentiel FR ouvert *(différenciant)* | ✅ (à *web-sourcer*) |
| **buildability** — MVP solo ~30 j, stack simple, pas de donnée propriétaire | ✅ |
| **margin** — pricing, récurrence, marge apparente | ✅ |
| **Preuve que ça marche à l'étranger** — force du signal de traction | 🔧 (dépend des signaux multi-source) |
| **Confiance / disponibilité de la donnée** — *pénalise* si invérifiable | ✨ (aligne le rang sur le publiable) |
| **Nouveauté** — pas déjà couvert, pas un effet de mode | ✨ (via dédup + graphe) |

`score = Σ wᵢ·featureᵢ` normalisé 0–100, `w` versionné (déjà le cas : `model_version`). Le score sort
le **top N en shortlist** ; l'humain choisit le gagnant — le pick final reste éditorial. **Règle
ajoutée au routage** ([lead-routing.ts](src/lib/sourcing/lead-routing.ts)) : *confiance faible → jamais
`direct`*, même si l'opportunité score haut. La confiance gate l'auto-publication.

---

## 11. Le mécanisme de fiabilité

Comment on évite concrètement le « chiffre inventé présenté comme un fait ». Sept mécanismes
simultanés (✅ = déjà partiellement en place).

1. **Provenance par construction** ✨ — chaque donnée porte `(source, url, méthode, date, raw)`. Non
   affichable sinon.
2. **Confiance typée par champ, pas par entreprise** ✨ — `verified/self_reported/estimated/weak/
   unknown` + confiance **calibrée** + décroissance de fraîcheur. L'UI ne montre jamais un chiffre nu
   sur de l'estimé : fourchette + méthode + confiance + « comment est-ce calculé ? ».
3. **Estimation = classement, pas vérité** ✨ — voir §9. C'est la correction n°1 vs le code actuel.
4. **Garde-fous d'absurdité** ✅→🔧 — généralisent `checkMrrSanity`.
5. **Agent critique adversarial** 🔧 — évolution de `verify-facts`/`verify-sources`.
6. **Gate éditorial humain** ✅ — le backstop que les concurrents ne peuvent s'offrir à leur échelle.
7. **« Données insuffisantes » de première classe** ✅ — votre routage `draft` rendu explicite comme
   *valeur*.

**Pourquoi plus d'intelligence DOIT vouloir dire plus d'honnêteté.** Un essaim d'agents autonomes sans
garde-fou hallucine avec assurance — mortel pour un produit dont toute la valeur est la fiabilité. Le
critique falsifie, la calibration mesure l'erreur réelle, la provenance ancre chaque chiffre : le
moteur « sait ce qu'il ne sait pas » parce que sa confiance est modélisée *et vérifiée*.

---

## 12. Anti-architecture (ce qu'il ne faut PAS construire)

- **Pas de gros annuaire de 10–100 k lignes.** Vous publiez 52/an. Garder un *pool de candidats* léger
  + un *store de dossiers* de quelques dizaines.
- **Pas de pipeline d'ingestion Meta Ads pour le sourcing.** API incomplète, UI hors-ToS à l'échelle.
  Consultation manuelle par finaliste. *(Le connecteur `meta_ads` du cockpit est un autre usage.)*
- **Pas d'API Reddit commerciale** (~12 k$/an). Sans objet.
- **Pas d'abonnements SEO/data premium** (Ahrefs/Semrush/Crunchbase) au départ. DataForSEO à l'usage.
- **Pas de SEO programmatique de masse.** L'acquisition ici = newsletter + qualité du pick.
- **Pas de connecteur « verified » opt-in Stripe** (le moat de TrustMRR) : non pertinent sur des SaaS
  *étrangers* sans relation avec vous.
- ⏳ **Monte-Carlo : oui, mais pour le classement, et pas avant d'avoir une quantité mesurée** (trafic/
  downloads). Tant qu'on n'a qu'une assertion LLM, MC = fausse précision → paliers/fourchettes larges.
- **Pas de bandit / reranker / calibration simulés à vide.** Ils ont besoin de mois de données réelles.
  Les faire semblant = fabriquer de la fausse intelligence (le péché des concurrents).
- **Pas de Temporal / microservices / pgvector au MVP.** Votre cron + queue + Postgres actuels suffisent.

**Compromis assumés.** Couverture faible (voulue) → on rate des opportunités : acceptable, on n'en
publie qu'une. Dépendance à l'humain éditorial : un coût, mais *le* mécanisme de fiabilité, finançable
à cette cadence. Build > buy sur le crawl ; buy (quasi gratuit) sur la donnée FR (Pappers).

---

## 13. Feuille de route (depuis votre système réel — pas de « concierge »)

Vous êtes déjà à ~Phase 2 d'un moteur automatisé. La feuille de route **comble les lacunes**, dans
l'ordre de valeur.

### Phase A — Honnêteté de la donnée *(petit code, gros gain, zéro source externe)*
Tables `opportunity_field_sources` + `sourcing_estimates` + `sourcing_signals`. Séparer
**estimé-pour-classer** de **publié-comme-fait**. `confidence`-gate ajouté au routage. UI : fourchette
+ palier + confiance + « comment c'est calculé ». **Répare immédiatement la faille : le MRR asserté par
Sonar ne peut plus s'afficher comme un fait.**

### Phase B — Le moat d'abord : détection « gap France » web-sourcée
Transformer `franceFit`/`competitionGap` d'un jugement LLM en un signal **web-sourcé** (recherche FR +
Pappers en confirmation), avec URLs de preuve. Score géo-arbitrage. **C'est ce qui vous différencie —
avant même la diversité des sources.**

### Phase C — Fiabilité par corroboration + diversité
2ᵉ scout indépendant (**Product Hunt API**) + expansion par graphe → dédup étendu (fusion
multi-source) → triangulation + agent critique adversarial (évolution de `verify-*`). La diversité
arrive *ici*, motivée par la corroboration, pas par le volume.

### Phase D — Le volant s'allume *(quand la donnée s'est accumulée)*
Reranker appris du goût éditorial (données déjà dans `opportunity_drafts`) → suivi des issues des picks
passés → magasin de calibration + recalibrage des confiances → niches émergentes + jumeau numérique du
solo-founder → orchestrateur-bandit. **Le moteur devient, chaque mois, plus dur à rattraper.**
Publication toujours sous gate humain.

---

## 14. Garde-fous légaux & RGPD

`[STABLE]` sauf mention. **Non-juridique — à valider par un conseil.**

- **Donnée d'entreprise** = largement OK ; **données de fondateurs** (noms, handles) = données perso →
  base « intérêt légitime », minimisation, droit d'opposition/effacement, registre. PH expurge déjà la
  PII makers → **préférer ne pas stocker de PII** sauf nécessité.
- **Pas de scraping derrière login/paywall/CAPTCHA** ; `robots.txt` + rate-limit ; journalisation de
  provenance (que vous avez déjà l'habitude de faire côté runs).
- **Droit *sui generis* des bases** (dir. 96/9/CE, art. L341-1 CPI) : ne pas ré-extraire une partie
  substantielle d'une base tierce → ne scraper aucun des trois concurrents.
- **Revenu estimé sur une société identifiable** = risque de dénigrement si présenté comme un fait →
  fourchette + « estimé » + méthode + confiance + **formulaire de correction/opt-out**. Risque bien
  plus faible que chez les concurrents grâce au cadre honnête + gate humain.
- **Créas publicitaires** : ne pas ré-héberger (droit d'auteur) → lien snapshot Meta.
- **Meta Ad Library** : consultation seulement ; ne pas industrialiser le scraping de l'UI.

---

## 15. Stack technique

Bonne nouvelle : **votre stack colle déjà à l'idéal** — cette section confirme plus qu'elle ne prescrit.

| Couche | Idéal | Chez vous |
|---|---|---|
| Frontend | Next.js + Tailwind + shadcn | ✅ |
| Hébergement | Vercel | ✅ |
| DB | Postgres (Supabase) | ✅ |
| LLM | Claude + Gemini (extraction/synthèse) | ✅ (Gemini Flash) + Sonar (web) |
| Crawl / enrichissement | Firecrawl (gratuit→Hobby) | ✨ à ajouter (Phase C) |
| Recherche vectorielle | pgvector *(Phase D)* | ✨ |
| Jobs / queues | Cron + queue légère | ✅ (workflows GitHub Actions + cron) |
| Auth / paiement | Supabase Auth + Stripe | ✅ |
| Monitoring | Sentry + PostHog | 🔧 (Sentry connecteur présent) |
| Données FR | Pappers / INPI | ✨ (Phase B) |

**Budget indicatif** *(à valider selon volume)* : Phases A–B ~50–150 €/mois (surtout LLM) ; Phase C
~150–400 €/mois (Firecrawl + PH + web FR) ; Phase D selon l'ambition du volant. Poste qui grossit en
premier : **le LLM d'enrichissement** → enrichissement paresseux (à la demande sur finalistes) plutôt
qu'en batch total.

---

## 16. Questions ouvertes

À trancher avant de builder au-delà de la Phase A.

1. **Où est la valeur : le chiffre, ou le plan de rebuild + Fit France ?** Hypothèse : le second (et
   votre produit le confirme déjà via `structure.ts`). Si faux, l'architecture change.
2. **Willingness-to-pay du segment.** Le pick hebdo est-il monétisable en direct, ou aimant (lead-gen)
   vers un produit à plus forte valeur (build clé-en-main, mode studio) ? *(Vous avez déjà pricing +
   cockpit — cohérent avec le second.)*
3. **Volume cible : strictement 1/semaine, ou feed classé + 1 « editor's pick » ?** Dimensionne tout.
4. **Une source quantitative mesurée est-elle au programme ?** (trafic DataForSEO / downloads) → si
   oui, Monte-Carlo (§9) remonte dans la roadmap ; sinon les fourchettes larges suffisent longtemps.
5. **Capacité éditoriale humaine : qui rédige/valide le dossier ?** C'est *ce* goulot — pas la
   technique — qui déterminera si le produit tient.

---

*Fin. Rappels d'honnêteté : coûts = ordres de grandeur à revalider ; les `[VÉRIFIÉ 2026]` proviennent
de recherches web à jour et peuvent évoluer (APIs Meta/Reddit/PH historiquement volatiles) ; la
conformité légale doit être validée par un conseil avant lancement public. Cette v2.0 remplace la v1.0
« aveugle » et le doc de travail `docs/sourcing-engine-v2-architecture.md` (consolidés ici).*
