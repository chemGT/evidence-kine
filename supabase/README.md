# Evidence Kiné — Supabase

> Serious Game pédagogique uniquement. Aucune donnée de patient réel.

## Structure

```
supabase/
├── migrations/
│   └── 001_shoulder_tests.sql   # Schema : body_regions, pathologies, clinical_tests, clinical_cases
└── seed/
    └── shoulder_tests.sql       # Seed clinimétrique (Se/Sp/LR) de l'épaule
```

## Commandes utiles

### Appliquer la migration en local

```bash
npx supabase db reset          # Recrée la DB locale et applique les migrations
psql $DATABASE_URL -f supabase/seed/shoulder_tests.sql
```

### Générer les types TypeScript

Après toute modification du schema :

```bash
npx supabase gen types typescript --local > src/types/database.types.ts
```

Le fichier actuel est un placeholder cohérent avec la migration 001. Il doit être régénéré dès que la CLI Supabase est installée et la DB locale démarrée.

### Variables d'environnement

Créer un fichier `.env.local` à la racine du projet :

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Sources scientifiques du seed

| Test | Source | DOI |
|------|--------|-----|
| Hawkins, Neer, Jobe, Full Can, Drop Arm, Sulcus, Load & Shift, O'Brien, Speed, Yergason | Hegedus et al., BJSM 2012 | `10.1136/bjsports-2012-091066` |
| External Rotation Lag Sign | Hertel et al., JSES 1996 | `10.1016/S1058-2746(96)80058-9` |
| Apprehension, Relocation, Surprise | Lo et al., AJSM 2004 | `10.1177/0363546503258869` |
| Biceps Load II | Kim et al., Arthroscopy 2001 | `10.1053/jars.2001.22404` |
