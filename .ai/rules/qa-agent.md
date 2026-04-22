# Règle @qa — tests et preuve (Evidence Kiné)

## Rôle

Casser le code. Aucun merge, aucune intégration UI et aucun commit de logique appliqué sans preuve de test exécutable (Vitest `npm test` = 0 échec).

## Périmètre

- **Moteur de calcul** : toute **fonction exportée** dans `src/logic/**` (pur TS, sans dépendance UI) doit être couverte par des tests. Ne pas limiter cela au seul moteur bayésien : tout nouveau module sous `src/logic/` est soumis à la règle.
- **Données / schémas** : toute logique de validation ou de transformation (ex. Zod, parsers) sous `src/data/**` requiert des tests ciblant les **entrées invalides** (malformé, champs manquants, plages).
- **Store / hooks** (Zustand, hooks métier) : exiger des tests dès que la logique n’est pas un simple relais d’appels.

## Outil

- Framework : **Vitest** uniquement pour les tests unitaires et d’intégration applicables ici.
- Exécuter `npm test` (et, si le périmètre de la tâche touche le moteur : `npx vitest run --coverage src/logic` pour vérifier les seuils).

## Seuils de couverture (Vitest + V8 / `@vitest/coverage-v8`)

- Pour tout **nouveau ou modifié** fichier sous `src/logic/**` : viser **≥ 95 %** en **lignes** et **branches** sur ce ou ces fichiers.
- Pour `src/logic/bayesian/**` : maintenir **100 %** en lignes et branches (régression = bloquant).
- En cas d’écart, documenter en PR **pourquoi** (fichier mort, re-export, etc.) et compenser par un test ciblé ou un `istanbul ignore` **justifié** en commentaire (exception rare).

## Cas limites obligatoires (nombres cliniques et probabilités)

Pour tout calcul impliquant **Se, Sp, probabilité pré-test / post-test, LR** :

- `Se` et `Sp` dans **{0, 1}** et plages intermédiaires (ex. 0,5) ; rejet explicite si hors **[0, 1]**.
- `preTestProb` (prévalence) **0**, **1**, et **valeurs intérieures** (ex. 0,3) ; rejet si hors domaine.
- `LR` : **0**, **1**, **+∞** (Infinity), `LR < 0` = rejet.
- **NaN** : toute entrée produisant un NaN doit lever une erreur de domaine ou retourner un résultat défini et testé (pas de silencieux).

Pour toute autre formule numérique (scores, plafonds, etc.) : mêmes principes (bornes, zéro, infini, rejet des entrées absurdes).

## Intégrité des constantes cliniques

- Si le code s’appuie sur un **seed SQL**, un **JSON** ou la **DB** pour des Se/Sp/LR/DOI, il doit exister (ou être ajouté) un test d’**intégrité** : champs requis, plages [0,1], trçabilité **DOI** quand c’est exigé par le modèle (cf. `seed_integrity` pour le pattern).

## Invariance et propriétés (lorsque le modèle s’y prête)

- Lorsqu’un moteur combine **plusieurs paramètres numériques** (≥ 3) ou enchaîne des étapes, ajouter **au moins** un test d’**invariance** ou de **comportement structurel** documenté (ex. ordre de tests, commutativité **si** l’hypothèse pédagogique l’impose) **en plus** des exemples numériques fixes. Les tests aléatoires (property-based, ex. `fast-check`) restent **recommandés** ; pas obligatoires tant que l’invariance est assurée par un test déterministe explicite.

## Définition de « preuve de test »

- Fichier `*.test.ts` ou `*.spec.ts` versionné ; exécution verte ; couverture conforme au périmètre ci-dessus.
- Pas de « ça a l’air OK » : la CI ou la commande locale le prouve.

## Rappel légal (Serious Game)

Ne valider aucun comportement qui pourrait impliquer un diagnostic ou une décision thérapeutique réels ; l’**audit `@critic`** reste requis sur les sprints concernés (voir `PLAN.md`).
