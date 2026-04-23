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

### Sprint 2 ter — Script d'installation reproductible — statut : **en cours** (S2T.1 → S2T.6 livrés, S2T.7 audit à planifier)

Agent : `@architect`
Objectif : stack locale complète en une commande, cross-plateforme (Windows PowerShell + Unix), idempotente. Prépare le terrain pour les Sprint 3 (2ᵉ seed `shoulder_cases.sql`), Sprint 5 (intégration E2E) et Sprint 6 (démo investisseurs / IFMK Lyon).

**Choix technique** : script **Node.js** unique (`scripts/setup.mjs`), évite la duplication `.sh` / `.ps1` et garantit la portabilité CI. Driver `pg` (pur JS) pour appliquer les seeds → zéro dépendance `psql` dans le `PATH`.

- [x] **S2T.1** [`scripts/lib/preflight.mjs`](scripts/lib/preflight.mjs) — checks Node ≥ 22.12, npm ≥ 9, Docker daemon, Supabase CLI. Helpers `parseVersion` / `meetsMinimum` injectables, messages d'erreur actionnables (liens doc).
- [x] **S2T.2** [`scripts/lib/psqlRunner.mjs`](scripts/lib/psqlRunner.mjs) — applique tous les `supabase/seed/*.sql` via driver `pg` (port 54322). `applySqlFile`, `listSeedFiles`, `applySeedDirectory` avec DI (ClientCtor, readFile, readdir).
- [x] **S2T.3** [`scripts/setup.mjs`](scripts/setup.mjs) — orchestrateur 8 étapes. Flags : `--skip-deps`, `--skip-supabase`, `--reset`, `--verbose`. Détection `supabase status` pour idempotence. Régénération types via `supabase gen types typescript --local`.
- [x] **S2T.4** [`package.json`](package.json) — scripts `setup`, `setup:reset`, `setup:tests-only`. Dépendances ajoutées : `pg ^8.13.0` + `@types/pg ^8.11.10` (devDependencies).
- [x] **S2T.5** Tests Vitest : [`scripts/__tests__/preflight.test.mjs`](scripts/__tests__/preflight.test.mjs) (25 tests) + [`scripts/__tests__/psqlRunner.test.mjs`](scripts/__tests__/psqlRunner.test.mjs) (13 tests). Couverture `scripts/lib/` : 100 % stmts/funcs/lines, 95.23 % branches → seuil 95 % respecté.
- [x] **S2T.6** [`README.md`](README.md) — section « Démarrage rapide » refaite : `npm install && npm run setup`. Tableau des 3 variantes de setup. Ancienne procédure manuelle conservée en fallback.
- [ ] **S2T.7** Audit `@critic` — reproductibilité, absence d'écrasement `.env.local`, message d'erreur clair si Docker off, aucune dépendance réseau hors Supabase local.

**Vérification CI (S2T.1 → S2T.6)** :
- `npm test` : **222/222** (177 existants + 45 nouveaux).
- `npm run test:coverage` : global 100 % stmts/funcs/lines, 98.13 % branches ; `scripts/lib/` 100 / 100 / 100 / 95.23 %.
- `npm run typecheck` / `npm run lint` clean.
- `npm run build` : zéro warning, bundle inchangé (142.73 KB JS + 14.04 KB CSS).
- `node scripts/setup.mjs --skip-supabase --skip-deps` sur poste Windows/PowerShell : preflight OK (Node v22.22.0, npm v11.11.1), Vitest 222/222, exit 0.

**Critères de clôture** :

1. `npm run setup` sur machine Windows vierge (Docker Desktop installé) → stack up, migration + seed appliqués, types générés, suite Vitest verte.
2. Second run de `npm run setup` : idempotent (pas d'erreur, pas d'écrasement).
3. `npm run setup:tests-only` : pas d'appel Docker/Supabase (utile CI logique pure). **[validé]**
4. Couverture Vitest ≥ 95 % sur `scripts/lib/` (cf. règle `@qa` durcie au Sprint 1 bis). **[validé — 100 / 100 / 100 / 95.23 %]**

**Validation E2E pleine stack (S2T.7)** : nécessite poste avec Docker Desktop actif — à exécuter lors de l'audit `@critic`.

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
 ├──► S2 ──► S2 ter ──► S3
 │                       │
 │                       ▼
 └──► S4 ───────────────►
```

Le Sprint 2 ter (script d'installation) est un **pré-requis opérationnel** du Sprint 3 : la nouvelle seed `shoulder_cases.sql` sera automatiquement prise en charge par la boucle de seed, évitant une procédure manuelle supplémentaire.

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

### Sprint 1 bis — Migration tooling + durcissement règle QA — statut : **clos** (2026-04-22)

Agents : `@architect`, `@qa`, `@critic`

Contexte : lors du Sprint 1, `npm install -D @vitest/coverage-v8` a entraîné un upgrade **non audité** de `vitest` (v2→v4) et `vite` (v5→v8), cassant implicitement le peer-dep `@vitejs/plugin-react@4.3.2`. Ce sprint corrige la dérive et durcit la règle `@qa`.

- [x] **M.1** [`@vitejs/plugin-react`](package.json) : `^4.3.2 → ^6.0.1` (version officielle Vite 8, peer `vite: ^8.0.0`)
- [x] **M.2** [`.ai/rules/qa-agent.md`](.ai/rules/qa-agent.md) durci : périmètre élargi (tout `src/logic/**`, `src/data/**`, stores), seuils quantifiés (≥ 95 % par fichier `src/logic/**`, 100 % `src/logic/bayesian/**`), cas limites exhaustifs, exigence d'intégrité cliniques (DOI/plages), test d'invariance pour moteur ≥ 3 paramètres
- [x] **M.3** [`.ai/agents/qa-agent.md`](.ai/agents/qa-agent.md) aligné (renvoi vers la règle, seuils explicites)
- [x] **M.4** [`vitest.config.ts`](vitest.config.ts) : seuils par glob — global 80 %, `src/logic/**` 95 %, `src/logic/bayesian/**` 100 %
- [x] **M.5** [`package.json`](package.json) : script `test:coverage`
- [x] **M.6** Audit `@critic` : **AUDIT : [OK]** (zéro impact clinique, warnings Vite 8 éliminés, gouvernance corrigée)

**Vérification CI** : `npm run build` 540 ms · **zéro warning** · bundle 142.73 KB JS + 13.84 KB CSS · `npm test` 132/132 · couverture globale 100 % · `npm run typecheck` / `npm run lint` clean.

**Breaking changes absorbés** : Vitest v2→v4 (API tests inchangée, thresholds per-glob OK), Vite v5→v8 (Rolldown/OXC transparents). Node min 22.12 (actuel : 22.22).

**Point de vigilance** : reporter coverage `text` v4 ne ventile plus par fichier dans la sortie console (summary OK, per-glob thresholds OK). À surveiller, non bloquant.

### Sprint 2 — Data access + Store — statut : **clos** (2026-04-22)

Agents : `@architect`, `@qa`, `@critic`

Objectif : state management découplé de l'UI (`CONVENTIONS.md`), repository + stores Zustand + hook de raisonnement bayésien, 100 % testés avec mock Supabase.

- [x] **S2.1** [`src/data/repositories/clinicalTestsRepo.ts`](src/data/repositories/clinicalTestsRepo.ts) — factory `createClinicalTestsRepository(client)` + `ClinicalTestsRepoError`. API : `fetchBodyRegion`, `fetchPathologiesByRegion`, `fetchClinicalTestsByPathology`. Lecture seule.
- [x] **S2.2** [`src/store/clinicalTestsStore.ts`](src/store/clinicalTestsStore.ts) — factory Zustand `createClinicalTestsStore(repo)` avec cache par slug, idempotence, flag `reload`, tracking `loading/error` par clé.
- [x] **S2.3** [`src/store/simulationStore.ts`](src/store/simulationStore.ts) — store pur (zéro dep Supabase) : `startSimulation`, `recordTestResult`, `undoLastTest`, `reset`. Rejette preTestProbability hors [0,1].
- [x] **S2.4** [`src/hooks/useBayesianReasoning.ts`](src/hooks/useBayesianReasoning.ts) — hook React + fonction pure `deriveBayesianReasoning`. Priorise LR seed, fallback `computeLikelihoodRatios`. Gère tests non résolus (`unresolvedTestIds`).
- [x] **S2.5** Tests Vitest avec [`supabaseMock.ts`](src/data/repositories/__tests__/supabaseMock.ts) chainable. 45 nouveaux tests (repo, 2 stores, hook pur) — couverture 100 %.
- [x] **S2.6** [`src/store/defaults.ts`](src/store/defaults.ts) — wiring prod isolé (évite lecture VITE_SUPABASE_* en tests).
- [x] Audit `@critic` : **AUDIT : [OK]** (DI respectée, LR prioritaires, Classe IIa OK, aucun write).

**Vérification CI** : `npm run build` 771 ms zéro warning · bundle 142.73 KB JS + 14.04 KB CSS · `npm test` 177/177 · couverture **100 % partout** (stmts/branches/funcs/lines) · typecheck + lint clean.

**Risque résiduel (Phase 2)** : in-flight dedup retourne `[]` pour les appels concurrents sur un même slug. Acceptable pour Serious Game (une vignette à la fois) ; à revoir pour dashboard multi-pathologies.

---

## Roadmap globale (rappel `EVOLUTION.md`)

- **Phase 1 Alpha** *(en cours)* : DB tests + moteur bayésien + prototype cliquable épaule
- **Phase 1 Alpha bis** *(après prototype)* : ingestion PDF via `content-agent` + extension cheville/genou/rachis
- **Phase 2 Beta** : Scoring Expert Game + Module Formation Lyon
- **Phase 3 Scale** : Stripe + Export PDF DPC-compliant

---

*Dernière mise à jour : @orchestrator — Sprint 2 ter S2T.1 → S2T.6 livrés par @architect (2026-04-22). En attente audit @critic (S2T.7) pour clôture.*
