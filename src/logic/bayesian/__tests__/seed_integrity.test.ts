import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

// =============================================================================
// Evidence Kine - QA : integrite du seed clinimetrique
// -----------------------------------------------------------------------------
// Ces tests parcourent le fichier supabase/seed/shoulder_tests.sql et verifient
// que chaque clinical_test insere respecte les regles cliniques et techniques :
//   - source_doi non vide (tracabilite scientifique)
//   - Se et Sp dans [0, 1]
//   - Se et Sp pas simultanement > 0.95 (garde-fou anti-surestimation)
//   - LR+ > 1 si fourni (le test doit augmenter la probabilite post-test)
//   - LR- < 1 si fourni (le test doit diminuer la probabilite post-test)
// =============================================================================

interface ParsedClinicalTest {
  slug: string;
  name_fr: string;
  sensitivity: number;
  specificity: number;
  lr_positive: number | null;
  lr_negative: number | null;
  source_doi: string | null;
}

const SEED_PATH = resolve(
  __dirname,
  "../../../../supabase/seed/shoulder_tests.sql",
);

/**
 * Extrait les INSERT into public.clinical_tests du seed SQL et en parse
 * la liste VALUES/SELECT. Attendu : chaque insertion suit exactement la
 * structure definie dans supabase/seed/shoulder_tests.sql (SELECT ... from ...).
 */
function parseClinicalTests(sql: string): ParsedClinicalTest[] {
  const tests: ParsedClinicalTest[] = [];

  const blockRegex =
    /insert\s+into\s+public\.clinical_tests[\s\S]*?select\s+p\.id,([\s\S]*?)from\s+public\.pathologies\s+p\s+where/gi;

  for (const match of sql.matchAll(blockRegex)) {
    const body = match[1];
    if (body === undefined) continue;
    const values = splitTopLevelCommas(body);

    if (values.length < 10) {
      throw new Error(
        `Seed parse error: insertion incomplete (${values.length} valeurs)`,
      );
    }

    // Ordre des colonnes dans l'INSERT (hors pathology_id deja couvert par p.id) :
    //   0=slug, 1=name_fr, 2=name_en, 3=procedure_description,
    //   4=sensitivity, 5=specificity, 6=lr_positive, 7=lr_negative,
    //   8=evidence_level, 9=source_doi, 10=source_reference
    const get = (i: number): string => {
      const v = values[i];
      if (v === undefined) {
        throw new Error(`Seed parse error: colonne ${i} absente`);
      }
      return v;
    };

    const lrPositiveRaw = get(6);
    const lrNegativeRaw = get(7);

    tests.push({
      slug: unquote(get(0)),
      name_fr: unquote(get(1)),
      sensitivity: Number(get(4)),
      specificity: Number(get(5)),
      lr_positive:
        lrPositiveRaw.trim().toLowerCase() === "null"
          ? null
          : Number(lrPositiveRaw),
      lr_negative:
        lrNegativeRaw.trim().toLowerCase() === "null"
          ? null
          : Number(lrNegativeRaw),
      source_doi: values[9] === undefined ? null : unquote(values[9]),
    });
  }

  return tests;
}

/**
 * Separe une liste d'arguments SQL au niveau 0 (ignore les virgules a
 * l'interieur de quotes simples ou de parentheses imbriquees).
 */
function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === "'") {
      if (inString && input[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inString = !inString;
      current += ch;
      continue;
    }

    if (!inString) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += ch;
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

describe("Seed clinimetrique - integrite (shoulder_tests.sql)", () => {
  const sql = readFileSync(SEED_PATH, "utf-8");
  const tests = parseClinicalTests(sql);

  it("charge au moins un test clinique", () => {
    expect(tests.length).toBeGreaterThan(0);
  });

  it("charge les tests attendus de l'epaule", () => {
    const slugs = tests.map((t) => t.slug);
    expect(slugs).toContain("hawkins-kennedy-impingement");
    expect(slugs).toContain("empty-can-jobe");
    expect(slugs).toContain("apprehension");
    expect(slugs).toContain("biceps-load-ii");
  });

  describe.each(tests)("test clinique : $name_fr ($slug)", (t) => {
    it("a un DOI source renseigne", () => {
      expect(t.source_doi, `DOI manquant pour ${t.slug}`).toBeTruthy();
      expect(t.source_doi).toMatch(/^10\.\d{4,9}\//);
    });

    it("a une sensibilite dans [0, 1]", () => {
      expect(t.sensitivity).toBeGreaterThanOrEqual(0);
      expect(t.sensitivity).toBeLessThanOrEqual(1);
    });

    it("a une specificite dans [0, 1]", () => {
      expect(t.specificity).toBeGreaterThanOrEqual(0);
      expect(t.specificity).toBeLessThanOrEqual(1);
    });

    it("n'a pas Se et Sp simultanement > 0.95 (garde-fou surestimation)", () => {
      const bothTooHigh = t.sensitivity > 0.95 && t.specificity > 0.95;
      expect(
        bothTooHigh,
        `${t.slug} : Se=${t.sensitivity}, Sp=${t.specificity} : valeurs trop optimistes, verifier la source`,
      ).toBe(false);
    });

    it("LR+ > 1 si renseigne (test discriminant en positif)", () => {
      if (t.lr_positive !== null) {
        expect(
          t.lr_positive,
          `${t.slug} : LR+ = ${t.lr_positive} <= 1 (test non discriminant)`,
        ).toBeGreaterThan(1);
      }
    });

    it("LR- < 1 si renseigne (test discriminant en negatif)", () => {
      if (t.lr_negative !== null) {
        expect(
          t.lr_negative,
          `${t.slug} : LR- = ${t.lr_negative} >= 1 (test non discriminant)`,
        ).toBeLessThan(1);
      }
    });
  });
});
