// =============================================================================
// Evidence Kine - Schema Zod : Vignette clinique fictive (Sprint 3)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Ce schema valide le champ `vignette_data` (jsonb) de la table
// `clinical_cases`. Il garantit la coherence entre le seed SQL, le store
// Zustand et l'UI du simulateur.
//
// Architecture :
//   VignetteDataSchema  (objet racine stocke dans vignette_data jsonb)
//   ├── AnamneseSchema       (contexte du cas : age, mecanisme, symptomes)
//   ├── ExamenPhysiqueSchema (constatations a l'examen)
//   ├── RedFlagSchema[]      (alertes urgentes pre-test)
//   └── SuggestedTestSchema[] (tests cliniques proposes au joueur)
//
// Les red flags urgents (fracture, luxation, atteinte neuro) sont exportes
// en constantes pour etre reutilises dans l'UI (Sprint 5 : RedFlagBadge).
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Sous-schemas atomiques
// ---------------------------------------------------------------------------

export const SexeSchema = z.enum(["homme", "femme"]);

export const CoteSchema = z.enum(["droit", "gauche", "bilateral"]);

/** "urgent" → blocage immédiat, "warning" → à surveiller. */
export const SeveriteRedFlagSchema = z.enum(["urgent", "warning"]);

export const AnamneseSchema = z.object({
  /** Age en années, plage pédiatrique exclue (≥ 16). */
  age: z.number().int().min(16).max(100),
  sexe: SexeSchema,
  /** Description libre du motif de consultation. */
  motifConsultation: z
    .string()
    .min(10, "Le motif doit comporter au moins 10 caractères"),
  /** Localisation anatomique de la plainte principale. */
  localisation: z.string().min(3),
  cote: CoteSchema.optional(),
  /** Description du délai et mode de début (ex : "brutal post-traumatique"). */
  debutSymptomes: z.string().min(3),
  /** Mécanisme lésionnel (optionnel si non traumatique). */
  mecanisme: z.string().optional(),
  /** Intensité douloureuse EVA/NRS 0-10. */
  intensiteDouleur: z.number().int().min(0).max(10).optional(),
  /** Antécédents pertinents (liste libre). */
  antecedents: z.array(z.string()).optional(),
});

export const ExamenPhysiqueSchema = z.object({
  inspection: z.string().optional(),
  /** Amplitudes actives : clé = mouvement, valeur = mesure textuelle. */
  amplitudesActives: z.record(z.string(), z.string()).optional(),
  /** Amplitudes passives. */
  amplitudesPassives: z.record(z.string(), z.string()).optional(),
  /** Synthèse des constatations palpatoires et du bilan musculaire. */
  bilan: z.string().optional(),
});

export const RedFlagSchema = z.object({
  /** Identifiant unique en kebab-case (ex : "fracture-humerale"). */
  id: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Format slug attendu (kebab-case, ex : "fracture-humerale")',
    ),
  label: z.string().min(3),
  description: z.string().min(10),
  severity: SeveriteRedFlagSchema,
  /** true = red flag présent chez ce patient fictif (déclenche alerte UI). */
  present: z.boolean(),
});

export const SuggestedTestSchema = z.object({
  /** Correspond à `clinical_tests.slug` dans la DB. */
  testSlug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      'Format slug attendu (kebab-case, ex : "empty-can-jobe")',
    ),
  /** Justification clinique affichée au joueur. */
  rationale: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Schema racine : VignetteDataSchema
// ---------------------------------------------------------------------------

/**
 * Schema du champ `vignette_data` stocké en jsonb dans `clinical_cases`.
 * Le disclaimer est obligatoire et doit mentionner explicitement le caractère
 * fictif du cas — condition légale non négociable (Classe IIa, MDCG 2021-24).
 */
export const VignetteDataSchema = z.object({
  disclaimer: z
    .string()
    .regex(
      /fictive|Serious Game/i,
      'Le disclaimer doit mentionner "fictive" ou "Serious Game"',
    ),
  anamnese: AnamneseSchema,
  examen: ExamenPhysiqueSchema,
  /** Au moins un red flag doit être défini (peut être present: false). */
  redFlags: z
    .array(RedFlagSchema)
    .min(1, "Au moins un red flag doit être défini"),
  /** Probabilité pré-test [0, 1] basée sur épidémiologie + contexte clinique. */
  preTestProbability: z
    .number()
    .min(0, "preTestProbability doit être dans [0, 1]")
    .max(1, "preTestProbability doit être dans [0, 1]"),
  /** Tests proposés au joueur, ordonnés par pertinence clinique. */
  suggestedTests: z
    .array(SuggestedTestSchema)
    .min(1, "Au moins un test suggéré est requis"),
});

// ---------------------------------------------------------------------------
// Types TypeScript dérivés
// ---------------------------------------------------------------------------

export type Sexe = z.infer<typeof SexeSchema>;
export type Cote = z.infer<typeof CoteSchema>;
export type SeveriteRedFlag = z.infer<typeof SeveriteRedFlagSchema>;
export type Anamnese = z.infer<typeof AnamneseSchema>;
export type ExamenPhysique = z.infer<typeof ExamenPhysiqueSchema>;
export type RedFlag = z.infer<typeof RedFlagSchema>;
export type SuggestedTest = z.infer<typeof SuggestedTestSchema>;
export type VignetteData = z.infer<typeof VignetteDataSchema>;

// ---------------------------------------------------------------------------
// Constantes : red flags de référence (épaule — Sprint 3/5)
// ---------------------------------------------------------------------------
// Exportées pour l'UI (RedFlagBadge.tsx, Sprint 4/5).
// Ces définitions font référence : toute vignette épaule DOIT les inclure.
// ---------------------------------------------------------------------------

export const SHOULDER_RED_FLAGS = Object.freeze({
  FRACTURE_HUMERALE: {
    id: "fracture-humerale",
    label: "Fracture humérale",
    description:
      "Douleur sévère, crépitations, déformation visible, impotence fonctionnelle totale après traumatisme",
    severity: "urgent",
  },
  LUXATION_GLENO_HUMERALE: {
    id: "luxation-gleno-humerale",
    label: "Luxation gléno-humérale",
    description:
      "Déformation en épaulette, bras en abduction/rotation latérale, vacuité glénoïdienne palpable",
    severity: "urgent",
  },
  ATTEINTE_NEUROLOGIQUE: {
    id: "atteinte-neuro",
    label: "Atteinte neurologique",
    description:
      "Déficit sensitif ou moteur (nerf axillaire : anesthésie moignon de l'épaule, paralysie deltoïde)",
    severity: "urgent",
  },
} as const satisfies Record<string, Omit<RedFlag, "present">>);
