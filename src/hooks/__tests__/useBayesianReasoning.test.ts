import { describe, expect, it } from "vitest";

import { deriveBayesianReasoning } from "@/hooks/useBayesianReasoning";
import type { PerformedTest } from "@/store/simulationStore";
import type { ClinicalTest } from "@/types/database.types";

// =============================================================================
// Evidence Kine - QA : deriveBayesianReasoning (fonction pure du hook)
// -----------------------------------------------------------------------------
// Teste la logique de derivation sans monter React. Le hook React lui-meme
// est un fin wrapper useMemo autour de cette fonction.
// =============================================================================

const JOBE: ClinicalTest = {
  id: "t-jobe",
  pathology_id: "p-cuff",
  slug: "empty-can-jobe",
  name_fr: "Jobe",
  name_en: null,
  procedure_description: "...",
  sensitivity: 0.69,
  specificity: 0.62,
  lr_positive: 1.82,
  lr_negative: 0.5,
  evidence_level: "2a",
  source_doi: "10.1136/bjsports-2012-091066",
  source_reference: null,
  created_at: "2026-04-20T00:00:00Z",
};

const DROP_ARM: ClinicalTest = {
  id: "t-drop-arm",
  pathology_id: "p-cuff",
  slug: "drop-arm",
  name_fr: "Drop Arm",
  name_en: null,
  procedure_description: "...",
  sensitivity: 0.21,
  specificity: 0.92,
  lr_positive: 2.63,
  lr_negative: 0.86,
  evidence_level: "2a",
  source_doi: "10.1136/bjsports-2012-091066",
  source_reference: null,
  created_at: "2026-04-20T00:00:00Z",
};

const JOBE_NO_LR: ClinicalTest = {
  ...JOBE,
  lr_positive: null,
  lr_negative: null,
};

describe("deriveBayesianReasoning - scenario nominal", () => {
  it("reproduit le resultat du Sprint 1 (30 % -> 44 % -> 67 %)", () => {
    const performed: PerformedTest[] = [
      { testId: JOBE.id, testSlug: JOBE.slug, outcome: "positive" },
      { testId: DROP_ARM.id, testSlug: DROP_ARM.slug, outcome: "positive" },
    ];

    const result = deriveBayesianReasoning(0.3, performed, [JOBE, DROP_ARM]);

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]?.testSlug).toBe("empty-can-jobe");
    expect(result.steps[0]?.postTestProb).toBeCloseTo(0.4382, 3);
    expect(result.finalProbability).toBeCloseTo(0.6723, 3);
    expect(result.unresolvedTestIds).toEqual([]);
  });

  it("recalcule LR a partir de Se/Sp si lr_positive/lr_negative sont null", () => {
    const performed: PerformedTest[] = [
      { testId: JOBE_NO_LR.id, testSlug: JOBE_NO_LR.slug, outcome: "positive" },
    ];

    const result = deriveBayesianReasoning(0.3, performed, [JOBE_NO_LR]);

    expect(result.steps).toHaveLength(1);
    // LR+ recalcule : 0.69 / 0.38 = 1.8158
    expect(result.steps[0]?.likelihoodRatio).toBeCloseTo(0.69 / 0.38, 3);
  });
});

describe("deriveBayesianReasoning - tests non resolus", () => {
  it("collecte les testIds inconnus dans unresolvedTestIds", () => {
    const performed: PerformedTest[] = [
      { testId: "t-unknown", testSlug: "unknown", outcome: "positive" },
      { testId: JOBE.id, testSlug: JOBE.slug, outcome: "positive" },
    ];

    const result = deriveBayesianReasoning(0.3, performed, [JOBE]);

    expect(result.unresolvedTestIds).toEqual(["t-unknown"]);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.testSlug).toBe("empty-can-jobe");
  });

  it("marque comme non resolu un test avec Se/Sp hors [0,1]", () => {
    const broken: ClinicalTest = {
      ...JOBE,
      id: "t-broken",
      slug: "broken",
      sensitivity: 1.5,
    };
    const performed: PerformedTest[] = [
      { testId: broken.id, testSlug: broken.slug, outcome: "positive" },
    ];

    const result = deriveBayesianReasoning(0.3, performed, [broken]);
    expect(result.unresolvedTestIds).toEqual(["t-broken"]);
    expect(result.finalProbability).toBe(0.3);
  });

  it("tolere une liste vide de tests realises", () => {
    const result = deriveBayesianReasoning(0.4, [], [JOBE, DROP_ARM]);
    expect(result.steps).toEqual([]);
    expect(result.finalProbability).toBe(0.4);
    expect(result.unresolvedTestIds).toEqual([]);
  });

  it("tolere une liste vide de tests disponibles (tous non resolus)", () => {
    const performed: PerformedTest[] = [
      { testId: JOBE.id, testSlug: JOBE.slug, outcome: "positive" },
    ];
    const result = deriveBayesianReasoning(0.3, performed, []);
    expect(result.unresolvedTestIds).toEqual([JOBE.id]);
    expect(result.finalProbability).toBe(0.3);
  });
});

describe("deriveBayesianReasoning - resolution par slug fallback", () => {
  it("resout un test par slug meme si testId ne matche pas", () => {
    const performed: PerformedTest[] = [
      { testId: "id-different", testSlug: JOBE.slug, outcome: "positive" },
    ];
    const result = deriveBayesianReasoning(0.3, performed, [JOBE]);
    expect(result.unresolvedTestIds).toEqual([]);
    expect(result.steps).toHaveLength(1);
  });
});

describe("deriveBayesianReasoning - LR seed prioritaire sur Se/Sp", () => {
  it("utilise lr_positive de la DB et non la valeur recalculee", () => {
    // Se/Sp donneraient LR+ = 0.69/0.38 ~= 1.8158 ; le seed stocke 1.82.
    const performed: PerformedTest[] = [
      { testId: JOBE.id, testSlug: JOBE.slug, outcome: "positive" },
    ];
    const result = deriveBayesianReasoning(0.3, performed, [JOBE]);
    expect(result.steps[0]?.likelihoodRatio).toBe(1.82);
  });
});
