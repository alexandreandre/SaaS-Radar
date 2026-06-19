# Recette QA — Emergent + Codex (Build 3×3)

Checklist manuelle avant merge. Tester sur **quote-generator-contractors** (FR + EN) et une opportunité `techComplexity: high`.

## Emergent

- [ ] Picker affiche 3 outils intermédiaires (v0 · Replit · Emergent)
- [ ] Kit généré FR + EN : 500+ mots, sections 1–8, auth + BDD mentionnés
- [ ] Guide ≥ 7 étapes lisibles (plan → prompt → auth/BDD → secrets → preview → itérer → deploy)
- [ ] Platform tips visibles (iterationHint, planMode)
- [ ] Deploy guide `.emergent.host` dans le module Build
- [ ] Tracking : URL seule, GitHub optionnel
- [ ] Journey step 3 actionDetail cohérent

## Codex

- [ ] Picker avancé affiche Codex (plus Windsurf)
- [ ] Kit mentionne AGENTS.md, .env.example, Supabase
- [ ] Guide : install CLI + login + coller prompt + Supabase + env
- [ ] Deploy : prompts GitHub/Vercel copiables
- [ ] Projet existant `windsurf` migré → `codex` sans perte de kit

## Migration legacy

- [ ] Ouvrir un projet avec `activeBuildToolId: windsurf` → affiche Codex
- [ ] Texte « Windsurf » remplacé par « Codex » dans mvpPrompt / setupRecipe
