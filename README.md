# Evidence Kiné

> **Serious Game pédagogique Evidence-Based Practice pour kinésithérapeutes.**
> Aucune donnée de patient réel. Pas un dispositif médical.

Simulateur bayésien d'orthopédie pour la formation au triage clinique et au diagnostic d'exclusion dans le cadre de l'Accès Direct français.

---

## Stack

| Domaine | Outil |
|---|---|
| Build & bundler | Vite 5 |
| Framework | React 18 + TypeScript strict |
| Style | Tailwind CSS + design tokens "Medical Excellence" |
| Composants | shadcn/ui + Radix UI |
| State | Zustand |
| Base de données | Supabase (Postgres + RLS) |
| Tests | Vitest + Testing Library |
| Qualité | ESLint + Prettier |

## Prérequis

- Node.js ≥ **22.12** (Vite 8 / Vitest 4)
- npm ≥ **9**
- Docker Desktop **démarré** (pour la stack Supabase locale)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) dans le `PATH`

## Démarrage rapide

En une commande, cross-plateforme (Windows PowerShell, macOS, Linux) :

```bash
npm install
npm run setup
```

Le script `scripts/setup.mjs` enchaîne automatiquement :

1. **Preflight** : versions Node/npm, Docker daemon joignable, Supabase CLI.
2. **Env** : crée `.env.local` depuis `.env.example` (sans écraser s'il existe déjà).
3. **Dépendances** : `npm install` (saute si déjà fait avec `--skip-deps`).
4. **Stack Supabase** : `supabase start` (idempotent, détecte si déjà up).
5. **Migrations** : `supabase db reset --no-seed`.
6. **Seeds** : applique tous les `supabase/seed/*.sql` via driver `pg`.
7. **Types** : régénère `src/types/database.types.ts`.
8. **Smoke test** : `npm test`.

Puis :

```bash
npm run dev
```

L'application est servie sur [http://localhost:5173](http://localhost:5173), Supabase Studio sur [http://127.0.0.1:54323](http://127.0.0.1:54323).

### Variantes

| Commande | Usage |
|---|---|
| `npm run setup` | Bootstrap complet (dev local + DB) |
| `npm run setup:reset` | Idem, force la remise à zéro de la DB |
| `npm run setup:tests-only` | Saute Docker + Supabase (CI logique pure) |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de dev Vite avec HMR |
| `npm run build` | Build de production (`tsc -b && vite build`) |
| `npm run preview` | Preview du build de production |
| `npm test` | Suite Vitest (run unique) |
| `npm run test:watch` | Vitest en mode watch |
| `npm run test:ui` | UI Vitest dans le navigateur |
| `npm run lint` | ESLint — 0 warning autorisé |
| `npm run format` | Prettier sur `src/` et `supabase/` |
| `npm run typecheck` | Vérification TypeScript sans émission |
| `npm run setup` | Bootstrap reproductible (preflight + DB + seeds + types + smoke) |
| `npm run setup:reset` | Setup avec remise à zéro forcée de la DB |
| `npm run setup:tests-only` | Setup sans Docker/Supabase (CI logique pure) |

## Supabase local — procédure manuelle (fallback)

`npm run setup` automatise ces étapes. À utiliser uniquement pour debug.

```bash
npx supabase start
npx supabase db reset --no-seed
node scripts/setup.mjs --skip-deps    # applique seeds + régénère types
```

Détails : voir [`supabase/README.md`](supabase/README.md).

## Structure du projet

```
src/
├── components/
│   ├── ui/              # Atomes shadcn/ui (Button, Card, Dialog…)
│   └── layout/          # Shells médical, navigation
├── data/
│   ├── repositories/    # Accès Supabase typé
│   └── schemas/         # Schémas Zod pour vignettes
├── hooks/               # Hooks React combinant store + logic
├── lib/                 # supabase client, utils (cn)
├── logic/
│   └── bayesian/        # Moteur de calcul pur, 100 % testé
├── store/               # Zustand (clinicalTests, simulation)
├── styles/              # tokens.css + globals.css
└── types/               # database.types.ts (généré)

supabase/
├── migrations/          # Schema SQL versionné
└── seed/                # Données cliniques (tests, cas fictifs)
```

## Philosophie de conception

Voir [`CONVENTIONS.md`](CONVENTIONS.md), [`STYLE.md`](STYLE.md), [`CONTEXT.md`](CONTEXT.md).

- **Logique bayésienne** strictement isolée dans `src/logic/` — pure TS, testable à 100 %
- **UI séparée du state** via Zustand + hooks
- **Tokens Medical Excellence** : `#FFFFFF`, `#007AFF`, `#FF3B30` (Red Flag exclusif), `#E9ECEC`
- **Typographie** : Inter (UI) + IBM Plex Sans (valeurs clinimétriques)
- **Accessibilité** : cibles tactiles 44×44 px, contraste AA

## Gouvernance

Feuille de route et avancement : voir [`PLAN.md`](PLAN.md).
Rôles des agents IA : voir [`AGENTS.md`](AGENTS.md) et [`.ai/agents/`](.ai/agents).

## Disclaimer

Evidence Kiné est un **Serious Game pédagogique**. Il n'a pas vocation à poser
un diagnostic réel et ne remplace en aucun cas l'avis d'un professionnel de
santé. Aucune donnée de patient réel ne doit être saisie dans l'application.
