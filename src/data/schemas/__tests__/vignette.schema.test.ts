// =============================================================================
// Evidence Kine - Tests schema Zod : VignetteDataSchema (Sprint 3)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Couverture :
//   1. Parsing schema valide  : vignette pilote complete + variantes minimales.
//   2. Parsing schema invalide : chaque champ obligatoire manquant ou hors
//      plage declenche une ZodError avec message lisible.
//   3. Red flags              : structure, severity enum, present: boolean.
//   4. SuggestedTests         : format slug, rationale optionnel.
//   5. Integrite seed SQL     : lecture shoulder_cases.sql, extraction JSON,
//      validation Zod, cross-reference des testSlug avec shoulder_tests.sql.
//   6. Constantes SHOULDER_RED_FLAGS : exhaustivite et coherence avec schema.
// =============================================================================

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SHOULDER_RED_FLAGS,
  VignetteDataSchema,
  type VignetteData,
} from "../vignette.schema";

// ---------------------------------------------------------------------------
// Fixture : vignette valide complete (miroir du seed shoulder_cases.sql)
// ---------------------------------------------------------------------------

const VALID_VIGNETTE: VignetteData = {
  disclaimer:
    "Vignette fictive — Serious Game pedagogique uniquement. Aucune donnee de patient reel.",
  anamnese: {
    age: 52,
    sexe: "homme",
    motifConsultation:
      "Douleur epaule droite persistante depuis 3 semaines suite a une chute de velo.",
    localisation: "Epaule droite, face antero-laterale",
    cote: "droit",
    debutSymptomes: "Debut brutal post-traumatique il y a 3 semaines",
    mecanisme: "Chute de velo, reception sur la main droite bras tendu",
    intensiteDouleur: 6,
    antecedents: ["Pas d'antecedent chirurgical", "Sportif amateur"],
  },
  examen: {
    inspection:
      "Legere amyotrophie deltoidienne droite. Pas de deformation visible.",
    amplitudesActives: {
      elevation_anterieure: "90 degres",
      abduction: "80 degres",
    },
    amplitudesPassives: { elevation_anterieure: "150 degres" },
    bilan: "Faiblesse en abduction 3/5. Douleur a la palpation du sus-epineux.",
  },
  redFlags: [
    {
      id: "fracture-humerale",
      label: "Fracture humerale",
      description:
        "Douleur severe, crepitations, deformation visible, impotence totale",
      severity: "urgent",
      present: false,
    },
    {
      id: "luxation-gleno-humerale",
      label: "Luxation gleno-humerale",
      description:
        "Deformation en epaulette, bras en abduction, vacuite glenoidienne",
      severity: "urgent",
      present: false,
    },
    {
      id: "atteinte-neuro",
      label: "Atteinte neurologique",
      description:
        "Deficit sensitif ou moteur, nerf axillaire, paralysie deltoide",
      severity: "urgent",
      present: false,
    },
  ],
  preTestProbability: 0.35,
  suggestedTests: [
    { testSlug: "empty-can-jobe", rationale: "Integrite sus-epineux" },
    { testSlug: "full-can", rationale: "Meilleure specificite" },
    { testSlug: "drop-arm", rationale: "Rupture transfixiante" },
    {
      testSlug: "external-rotation-lag-sign",
      rationale: "Specificite tres elevee",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper : deep merge partiel pour tester les cas invalides
// ---------------------------------------------------------------------------
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

function withOverride(override: DeepPartial<VignetteData>) {
  return { ...VALID_VIGNETTE, ...override };
}

// ---------------------------------------------------------------------------
// 1. Parsing valide
// ---------------------------------------------------------------------------

describe("VignetteDataSchema — parsing valide", () => {
  it("accepte la vignette pilote complete", () => {
    const result = VignetteDataSchema.safeParse(VALID_VIGNETTE);
    expect(result.success).toBe(true);
  });

  it("accepte preTestProbability = 0 (cas controle negativ)", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ preTestProbability: 0 }),
    );
    expect(result.success).toBe(true);
  });

  it("accepte preTestProbability = 1 (certitude theorique)", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ preTestProbability: 1 }),
    );
    expect(result.success).toBe(true);
  });

  it("accepte examen entierement vide (champs optionnels)", () => {
    const result = VignetteDataSchema.safeParse(withOverride({ examen: {} }));
    expect(result.success).toBe(true);
  });

  it("accepte anamnese sans champs optionnels", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        anamnese: {
          age: 40,
          sexe: "femme",
          motifConsultation: "Douleur epaule gauche depuis 2 mois.",
          localisation: "Epaule gauche",
          debutSymptomes: "Progressif",
        },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("accepte suggestedTest sans rationale (optionnel)", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        suggestedTests: [{ testSlug: "drop-arm" }],
      }),
    );
    expect(result.success).toBe(true);
  });

  it("accepte un red flag avec present: true (red flag actif)", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        redFlags: [
          {
            id: "fracture-humerale",
            label: "Fracture humerale",
            description: "Douleur severe, crepitations, deformation visible",
            severity: "urgent",
            present: true,
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Parsing invalide — disclaimer
// ---------------------------------------------------------------------------

describe("VignetteDataSchema — disclaimer", () => {
  it("rejette si disclaimer absent de 'fictive' ou 'Serious Game'", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ disclaimer: "Consultation medicale reelle." }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "";
      expect(msg).toMatch(/fictive|Serious Game/i);
    }
  });

  it("accepte disclaimer contenant 'Serious Game'", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ disclaimer: "Serious Game educatif." }),
    );
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Parsing invalide — anamnese
// ---------------------------------------------------------------------------

describe("VignetteDataSchema — anamnese invalide", () => {
  it("rejette age < 16", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ anamnese: { ...VALID_VIGNETTE.anamnese, age: 15 } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette age > 100", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ anamnese: { ...VALID_VIGNETTE.anamnese, age: 101 } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette age decimal", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ anamnese: { ...VALID_VIGNETTE.anamnese, age: 52.5 } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette sexe hors enum", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        anamnese: {
          ...VALID_VIGNETTE.anamnese,
          sexe: "inconnu" as "homme",
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette motifConsultation trop court (< 10 chars)", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        anamnese: { ...VALID_VIGNETTE.anamnese, motifConsultation: "Court" },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette intensiteDouleur > 10", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        anamnese: { ...VALID_VIGNETTE.anamnese, intensiteDouleur: 11 },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette intensiteDouleur decimal", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        anamnese: { ...VALID_VIGNETTE.anamnese, intensiteDouleur: 6.5 },
      }),
    );
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Parsing invalide — preTestProbability
// ---------------------------------------------------------------------------

describe("VignetteDataSchema — preTestProbability", () => {
  it("rejette probabilite negative", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ preTestProbability: -0.01 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette probabilite > 1", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ preTestProbability: 1.01 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette NaN", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ preTestProbability: NaN }),
    );
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Parsing invalide — redFlags
// ---------------------------------------------------------------------------

describe("VignetteDataSchema — redFlags", () => {
  it("rejette tableau vide (au moins un red flag requis)", () => {
    const result = VignetteDataSchema.safeParse(withOverride({ redFlags: [] }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("red flag");
    }
  });

  it("rejette red flag avec id non kebab-case", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        redFlags: [
          {
            id: "Fracture Humerale",
            label: "Fracture",
            description: "Description suffisamment longue pour passer",
            severity: "urgent",
            present: false,
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette severity hors enum", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        redFlags: [
          {
            id: "fracture-humerale",
            label: "Fracture",
            description: "Description suffisamment longue pour passer",
            severity: "critique" as "urgent",
            present: false,
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette present non booleen", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        redFlags: [
          {
            id: "fracture-humerale",
            label: "Fracture",
            description: "Description suffisamment longue pour passer",
            severity: "urgent",
            present: "non" as unknown as boolean,
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepte severity 'warning' (red flag de surveillance)", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        redFlags: [
          {
            id: "douleur-nuit",
            label: "Douleur nocturne",
            description:
              "Douleur reveillant la nuit, possible origine tumorale",
            severity: "warning",
            present: false,
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Parsing invalide — suggestedTests
// ---------------------------------------------------------------------------

describe("VignetteDataSchema — suggestedTests", () => {
  it("rejette tableau vide", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({ suggestedTests: [] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejette testSlug avec majuscules (non kebab-case)", () => {
    const result = VignetteDataSchema.safeParse(
      withOverride({
        suggestedTests: [{ testSlug: "Empty_Can_Jobe" }],
      }),
    );
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Constantes SHOULDER_RED_FLAGS
// ---------------------------------------------------------------------------

describe("SHOULDER_RED_FLAGS", () => {
  it("definit les 3 red flags de l'epaule", () => {
    expect(Object.keys(SHOULDER_RED_FLAGS)).toHaveLength(3);
    expect(SHOULDER_RED_FLAGS.FRACTURE_HUMERALE.id).toBe("fracture-humerale");
    expect(SHOULDER_RED_FLAGS.LUXATION_GLENO_HUMERALE.id).toBe(
      "luxation-gleno-humerale",
    );
    expect(SHOULDER_RED_FLAGS.ATTEINTE_NEUROLOGIQUE.id).toBe("atteinte-neuro");
  });

  it("tous les severity sont 'urgent'", () => {
    for (const flag of Object.values(SHOULDER_RED_FLAGS)) {
      expect(flag.severity).toBe("urgent");
    }
  });

  it("tous les id sont en kebab-case valide", () => {
    for (const flag of Object.values(SHOULDER_RED_FLAGS)) {
      expect(flag.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("tous les id correspondent aux red flags de la vignette pilote", () => {
    const vignetteIds = VALID_VIGNETTE.redFlags.map((f) => f.id);
    for (const flag of Object.values(SHOULDER_RED_FLAGS)) {
      expect(vignetteIds).toContain(flag.id);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Integrite seed SQL (shoulder_cases.sql)
// ---------------------------------------------------------------------------

const SEED_CASES_PATH = resolve(
  __dirname,
  "../../../../supabase/seed/shoulder_cases.sql",
);

const SEED_TESTS_PATH = resolve(
  __dirname,
  "../../../../supabase/seed/shoulder_tests.sql",
);

/**
 * Extrait le bloc JSON entre les dollar-quotes $vignette_json$...$vignette_json$
 * du seed SQL et le parse en objet JS.
 */
function extractVignetteJson(sql: string): unknown {
  const match = sql.match(/\$vignette_json\$([\s\S]*?)\$vignette_json\$/);
  if (!match || !match[1]) {
    throw new Error(
      "shoulder_cases.sql : bloc $vignette_json$...$vignette_json$ introuvable",
    );
  }
  return JSON.parse(match[1]);
}

/**
 * Extrait tous les slugs de clinical_tests dans shoulder_tests.sql.
 * Pattern : le slug est la 1re valeur apres `select p.id,` dans chaque INSERT.
 */
function extractTestSlugs(sql: string): string[] {
  const slugs: string[] = [];
  const re = /select\s+p\.id,\s*\r?\n\s*'([a-z0-9-]+)'/g;
  for (const match of sql.matchAll(re)) {
    if (match[1]) slugs.push(match[1]);
  }
  return slugs;
}

describe("Seed integrite — shoulder_cases.sql", () => {
  const sqlCases = readFileSync(SEED_CASES_PATH, "utf-8");
  const sqlTests = readFileSync(SEED_TESTS_PATH, "utf-8");

  it("le fichier seed contient exactement un bloc $vignette_json$", () => {
    const count = (sqlCases.match(/\$vignette_json\$/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("le JSON extrait est valide (parse sans erreur)", () => {
    expect(() => extractVignetteJson(sqlCases)).not.toThrow();
  });

  it("la vignette extraite valide le schema Zod", () => {
    const data = extractVignetteJson(sqlCases);
    const result = VignetteDataSchema.safeParse(data);
    if (!result.success) {
      throw new Error(
        "shoulder_cases.sql : vignette_data ne valide pas le schema Zod :\n" +
          result.error.issues
            .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
            .join("\n"),
      );
    }
    expect(result.success).toBe(true);
  });

  it("preTestProbability de la vignette pilote est dans ]0, 1[", () => {
    const data = extractVignetteJson(sqlCases) as {
      preTestProbability: number;
    };
    expect(data.preTestProbability).toBeGreaterThan(0);
    expect(data.preTestProbability).toBeLessThan(1);
  });

  it("le disclaimer mentionne le caractere fictif", () => {
    const data = extractVignetteJson(sqlCases) as { disclaimer: string };
    expect(data.disclaimer).toMatch(/fictive|Serious Game/i);
  });

  it("tous les red flags ont present: false dans la vignette pilote", () => {
    const data = extractVignetteJson(sqlCases) as {
      redFlags: Array<{ present: boolean }>;
    };
    for (const flag of data.redFlags) {
      expect(flag.present).toBe(false);
    }
  });

  it("les testSlug de suggestedTests existent dans shoulder_tests.sql", () => {
    const data = extractVignetteJson(sqlCases) as {
      suggestedTests: Array<{ testSlug: string }>;
    };
    const knownSlugs = extractTestSlugs(sqlTests);
    for (const { testSlug } of data.suggestedTests) {
      expect(
        knownSlugs,
        `testSlug "${testSlug}" introuvable dans shoulder_tests.sql`,
      ).toContain(testSlug);
    }
  });

  it("le seed insere la vignette avec is_published = true", () => {
    expect(sqlCases).toContain("true");
    expect(sqlCases).toContain("is_published");
  });

  it("le seed utilise 'shoulder-rotator-cuff-tear' comme pathologie cible", () => {
    expect(sqlCases).toContain("shoulder-rotator-cuff-tear");
  });
});
