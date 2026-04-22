# PLAN.md — Evidence Kiné

> Fichier géré par **@orchestrator**. Toute modification est validée humainement avant exécution par l'agent concerné (voir `AGENTS.md`).
> **Règle d'or** : 1 étape = 1 commit (`.ai/agents/orchestrator-agent.md`).
>
> Disclaimer légal permanent : *Serious Game pédagogique uniquement. Aucune donnée de patient réel.*

---

## Cadrage Phase 1 Alpha

| Décision | Valeur |
|---|---|
| Pathologie pilote | **Épaule** (exploite la DB déjà seedée) |
| Livrable cible | **Prototype cliquable** — 1 vignette jouable end-to-end (démo investisseurs / IFMK Lyon) |
| Gouvernance | Chaque sprint audité par `@critic` avant merge, QA finale par `@qa` avant clôture |

### Architecture cible

```
Supabase Seed ──► Zustand Store ──► Moteur Bayésien (pur TS) ──► UI Medical Excellence
                                         │
                         Vignette JSON ──┘
```

---

## Sprint en cours

*Aucun sprint actif — prêt à lancer Sprint 2 (Data access + Store).*

---

## Feuille de route Phase 1 Alpha

### Sprint 2 — Data access + Store — statut : à faire

Agent : `@architect`
Objectif : state management découplé de l'UI (`CONVENTIONS.md`).

- [ ] **S2.1** `src/data/repositories/clinicalTestsRepo.ts` — fetch tests/pathologies via client Supabase
- [ ] **S2.2** `src/store/clinicalTestsStore.ts` (Zustand) — cache tests par pathologie
- [ ] **S2.3** `src/store/simulationStore.ts` — état vignette : `{ preTestProb, testsPerformed[], currentProb }`
- [ ] **S2.4** `src/hooks/useBayesianReasoning.ts` — sélecteur combinant store + `cascade.ts`
- [ ] **S2.5** Tests store avec mock Supabase

### Sprint 3 — Vignette clinique pilote — statut : à faire

Agent : `@scientific`
Objectif : 1 cas fictif jouable + schéma réutilisable.

- [ ] **S3.1** `src/data/schemas/vignette.schema.ts` (Zod) : `{ anamnese, examen, redFlags[], preTestProb, suggestedTests[] }`
- [ ] **S3.2** Migration `supabase/migrations/002_clinical_cases_extensions.sql` (si nouveaux champs jsonb requis)
- [ ] **S3.3** Seed `supabase/seed/shoulder_cases.sql` — vignette « Homme 52 ans, douleur épaule D post-chute vélo, faiblesse élévation »
- [ ] **S3.4** Red flags codifiés (fracture, luxation, atteinte neuro)
- [ ] **S3.5** Tests validation schéma Vitest
- [ ] **S3.6** Audit `@critic` — caractère fictif, disclaimer présent

### Sprint 4 — UI Medical Excellence (atomes) — statut : à faire

Agent : `@ui`
Objectif : composants sobres, accessibles, conformes à `STYLE.md`.

- [ ] **S4.1** `src/components/ui/ProbabilityGauge.tsx` — IBM Plex Sans, transition 160 ms ease-out
- [ ] **S4.2** `src/components/ui/ClinicalTestCard.tsx` — Se/Sp/LR + boutons +/−
- [ ] **S4.3** `src/components/ui/RedFlagBadge.tsx` — rouge `#FF3B30` **exclusif**
- [ ] **S4.4** `src/components/ui/VignetteHeader.tsx`
- [ ] **S4.5** `src/components/layout/MedicalLayout.tsx` — fond blanc pur, cibles tactiles 44×44 px
- [ ] **S4.6** Route `/kitchen-sink` pour revue visuelle (ou Storybook)

### Sprint 5 — Intégration end-to-end — statut : à faire

Agents : `@ui` + `@architect`
Objectif : vignette jouable du clic au calcul bayésien.

- [ ] **S5.1** Route `/simulator/shoulder/:caseSlug` (React Router)
- [ ] **S5.2** Chargement vignette + tests disponibles par pathologie suspectée
- [ ] **S5.3** Flow UX « choisir test → saisir résultat +/− → recalcul probabilité » (règle des 3 clics)
- [ ] **S5.4** Affichage raisonnement bayésien : pré-test → LR appliqué → post-test
- [ ] **S5.5** Détection et affichage des red flags (mise en avant `#FF3B30`)
- [ ] **S5.6** Disclaimer légal permanent en footer

### Sprint 6 — QA finale & Polish — statut : à faire

Agent : `@qa`
Objectif : prototype demo-ready.

- [ ] **S6.1** Audit accessibilité (contraste AA, focus visible, 44×44 px)
- [ ] **S6.2** 1 scénario E2E Playwright (parcours vignette complète)
- [ ] **S6.3** Couverture 100 % `src/logic/` (tests de régression moteur bayésien)
- [ ] **S6.4** README racine + screenshots + vidéo démo (30 s)
- [ ] **S6.5** Audit `@critic` final — Classe IIa, privacy, EBP
- [ ] **S6.6** Tag `v0.1.0-alpha` + clôture Phase 1 Alpha dans `EVOLUTION.md`

---

## Dépendances entre sprints

```
S0 ──► S1 ──┐
 │          ├──► S5 ──► S6
 ├──► S2 ───┤
 │    │     │
 │    └──► S3
 │
 └──► S4 ────┘
```

---

## Historique

### Sprint 0 — Bootstrap technique — statut : **clos** (2026-04-20)

Agent : `@architect`

- [x] **S0.1** [`package.json`](package.json), [`vite.config.ts`](vite.config.ts), [`tsconfig.*.json`](tsconfig.json), [`index.html`](index.html), [`src/main.tsx`](src/main.tsx), [`src/App.tsx`](src/App.tsx)
- [x] **S0.2** [`tailwind.config.ts`](tailwind.config.ts), [`postcss.config.js`](postcss.config.js), [`src/styles/tokens.css`](src/styles/tokens.css), [`src/styles/globals.css`](src/styles/globals.css) — tokens `action`, `redflag`, fonts Inter + IBM Plex Sans, `duration-medical` 160ms
- [x] **S0.3** [`vitest.config.ts`](vitest.config.ts), [`vitest.setup.ts`](vitest.setup.ts), [`.eslintrc.cjs`](.eslintrc.cjs), [`.prettierrc`](.prettierrc)
- [x] **S0.4** [`components.json`](components.json), [`src/lib/utils.ts`](src/lib/utils.ts), [`src/components/ui/button.tsx`](src/components/ui/button.tsx), [`src/components/ui/card.tsx`](src/components/ui/card.tsx), [`src/components/ui/dialog.tsx`](src/components/ui/dialog.tsx)
- [x] **S0.5** [`supabase/config.toml`](supabase/config.toml) — ports locaux (54321 API, 54322 DB, 54323 Studio)
- [x] **S0.6** [`.env.example`](.env.example), [`README.md`](README.md), scripts `dev`/`build`/`test`/`lint`/`typecheck`/`format`

**Vérification CI** : `npm run lint` 0 warning · `npm run typecheck` clean · `npm test` 92/92 · `npm run build` 15 KB CSS + 144 KB JS

### Sprint DB Épaule — statut : **clos** (2026-04-20)

Agents : `@architect`, `@scientific`, `@qa`

- [x] **A** Migration [`supabase/migrations/001_shoulder_tests.sql`](supabase/migrations/001_shoulder_tests.sql) — 4 tables, RLS, contraintes
- [x] **B** Seed [`supabase/seed/shoulder_tests.sql`](supabase/seed/shoulder_tests.sql) — 2 régions, 6 pathologies, 14 tests sourcés DOI
- [x] **D** Client [`src/lib/supabase.ts`](src/lib/supabase.ts) + types [`src/types/database.types.ts`](src/types/database.types.ts) + [`supabase/README.md`](supabase/README.md)
- [x] **C** Tests d'intégrité [`src/logic/bayesian/__tests__/seed_integrity.test.ts`](src/logic/bayesian/__tests__/seed_integrity.test.ts) — DOI, Se/Sp, LR

**Sources scientifiques** : Hegedus BJSM 2012 (`10.1136/bjsports-2012-091066`), Lo AJSM 2004 (`10.1177/0363546503258869`), Hertel JSES 1996 (`10.1016/S1058-2746(96)80058-9`), Kim Arthroscopy 2001 (`10.1053/jars.2001.22404`).

### Sprint 1 — Moteur bayésien — statut : **clos** (2026-04-22)

Agents : `@architect`, `@qa`, `@critic`

- [x] **S1.1** [`src/logic/bayesian/likelihoodRatios.ts`](src/logic/bayesian/likelihoodRatios.ts) — `computeLikelihoodRatios({Se, Sp}) → {LR+, LR-}`, gère Sp=1 (LR+=∞), Se=1 (LR-=0)
- [x] **S1.2** [`src/logic/bayesian/bayes.ts`](src/logic/bayesian/bayes.ts) — `postTestProbability(preTestProb, LR)` via Bayes sur les odds + helpers `probabilityToOdds` / `oddsToProbability`
- [x] **S1.3** [`src/logic/bayesian/cascade.ts`](src/logic/bayesian/cascade.ts) — `runCascade(initialProb, steps[])` avec traçage par étape, API n'accepte que des LR (pas de Se/Sp)
- [x] **S1.4** [`src/logic/bayesian/__tests__/bayes.test.ts`](src/logic/bayesian/__tests__/bayes.test.ts) — 26 tests : Se=0/1, Sp=0/1, preTest=0/1, LR=0/1/∞, NaN, domaine [0,1]
- [x] **S1.5** [`src/logic/bayesian/__tests__/cascade.test.ts`](src/logic/bayesian/__tests__/cascade.test.ts) — 14 tests : scénario coiffe 30 % → Jobe+ (~44 %) → Drop Arm+ (~67 %), commutativité, absorption 0/1
- [x] **S1.6** Audit `@critic` : **AUDIT : [OK]** (LR exclusif, Classe IIa respectée, disclaimers, indépendance conditionnelle explicitée)

**Vérification CI** : `npm run lint` 0 warning · `npm run typecheck` clean · `npm test` 132/132 · couverture `src/logic/bayesian/` **100 %** (stmts/branches/funcs/lines)

**Dépendance ajoutée** : [`@vitest/coverage-v8`](package.json) `^2.1.2` (devDependency) pour mesurer la couverture.

**Risque résiduel (à traiter Sprint 5)** : hypothèse d'indépendance conditionnelle surestime la probabilité finale quand deux tests explorent la même fonction (ex. Jobe + Full Can) → afficher note pédagogique dans l'UI.

---

## Roadmap globale (rappel `EVOLUTION.md`)

- **Phase 1 Alpha** *(en cours)* : DB tests + moteur bayésien + prototype cliquable épaule
- **Phase 1 Alpha bis** *(après prototype)* : ingestion PDF via `content-agent` + extension cheville/genou/rachis
- **Phase 2 Beta** : Scoring Expert Game + Module Formation Lyon
- **Phase 3 Scale** : Stripe + Export PDF DPC-compliant

---

*Dernière mise à jour : @orchestrator — Sprint 1 Moteur bayésien clos (2026-04-22), Sprint 2 Data access + Store prêt à démarrer.*
