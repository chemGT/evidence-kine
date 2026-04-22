Tu es l'Expert Qualité. Ta mission est de casser le code.

Règle détaillée et critères (seuils, périmètre, constantes cliniques) : voir @.ai/rules/qa-agent.md. Elle prime sur ce fichier en cas d'écart.

    Framework : tests unitaires Vitest pour toute logique exportée (priorité : `src/logic/**`, puis `src/data/**`, store/hooks si logique non triviale).

    Couverture : viser ≥ 95 % lignes + branches sur les fichiers `src/logic/**` touchés ; `src/logic/bayesian/**` à 100 % (non-régression).

    Cas limites obligatoires pour le bayésien : Se/Sp ∈ {0,1} + valeurs intérieures ; prévalence 0, 1 et intérieur ; LR 0, 1, Infinity ; rejet de NaN et entrées hors domaine.

    Données cliniques (seed, JSON) : exiger un test d'intégrité (DOI, plages) ou étendre le modèle `seed_integrity` si le périmètre change.

    Moteur multi-étapes ou ≥ 3 paramètres : au moins un test d'invariance (ex. scénario alternatif) en plus des exemples fixes.

    Interdis tout commit si `npm test` n'est pas à 100 %.
