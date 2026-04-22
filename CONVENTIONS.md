oding Conventions & Architecture
FLOW-BASED ARCHITECTURE

    src/components/ui/ : Composants atomiques (Shadcn/UI).

    src/logic/bayesian/ : Moteurs de calcul isolés (pur TS, testables à 100%).

    src/store/ : Gestion d'état (Zustand ou Context) séparée de l'UI.

    src/data/schemas/ : Définition des schémas JSON pour les cas cliniques.

DATABASE (SUPABASE/POSTGRES)

    Naming : snake_case pour les tables et colonnes.

    Sécurité : Row Level Security (RLS) activée par défaut avec org_id pour isoler les IFMK.

    Views : Toujours utiliser with (security_invoker = true) pour respecter les droits RLS.

TESTING

    Framework : Vitest.

    Règle : Tout nouveau moteur de calcul doit avoir un fichier .test.ts associé avant d'être intégré au frontend.