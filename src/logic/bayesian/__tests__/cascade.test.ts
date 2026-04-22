import { describe, it, expect } from "vitest";

import { runCascade, type CascadeStepInput } from "../cascade";
import { computeLikelihoodRatios } from "../likelihoodRatios";

// =============================================================================
// Evidence Kine - QA : cascade bayesienne (chainage de tests)
// -----------------------------------------------------------------------------
// Scenario pedagogique exige par PLAN.md (S1.5) :
//   Coiffe des rotateurs prior 30 % + Jobe + + Drop Arm +
//
// Valeurs seed (supabase/seed/shoulder_tests.sql) :
//   - empty-can-jobe : Se=0.69, Sp=0.62, LR+ seed=1.82, LR- seed=0.50
//   - drop-arm       : Se=0.21, Sp=0.92, LR+ seed=2.63, LR- seed=0.86
//
// Rappel : Hegedus BJSM 2012 (DOI 10.1136/bjsports-2012-091066).
// =============================================================================

const JOBE: CascadeStepInput = {
  testSlug: "empty-can-jobe",
  lrPositive: 1.82,
  lrNegative: 0.5,
  outcome: "positive",
};

const DROP_ARM: CascadeStepInput = {
  testSlug: "drop-arm",
  lrPositive: 2.63,
  lrNegative: 0.86,
  outcome: "positive",
};

describe("runCascade - scenario epaule (coiffe 30 % + Jobe+ + Drop Arm+)", () => {
  const result = runCascade(0.3, [JOBE, DROP_ARM]);

  it("trace exactement une etape par test, dans l'ordre d'application", () => {
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]?.testSlug).toBe("empty-can-jobe");
    expect(result.steps[1]?.testSlug).toBe("drop-arm");
  });

  it("conserve la probabilite initiale", () => {
    expect(result.initialProbability).toBe(0.3);
  });

  it("chaine post-test(n) = pre-test(n+1)", () => {
    const first = result.steps[0];
    const second = result.steps[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first?.preTestProb).toBe(0.3);
    expect(second?.preTestProb).toBe(first?.postTestProb);
  });

  it("applique le LR+ quand le test est positif (et non le LR-)", () => {
    expect(result.steps[0]?.likelihoodRatio).toBe(JOBE.lrPositive);
    expect(result.steps[1]?.likelihoodRatio).toBe(DROP_ARM.lrPositive);
  });

  it("augmente la probabilite : 30 % -> ~44 % -> ~67 %", () => {
    // Jobe+ :    0.3 / 0.7 * 1.82 = 0.7800 -> 0.4382
    // Drop Arm+: 0.4382 / 0.5618 * 2.63 = 2.0515 -> 0.6723
    expect(result.steps[0]?.postTestProb).toBeCloseTo(0.4382, 3);
    expect(result.finalProbability).toBeCloseTo(0.6723, 3);
  });

  it("le resultat final est strictement superieur au prior (deux LR+ > 1)", () => {
    expect(result.finalProbability).toBeGreaterThan(result.initialProbability);
    expect(result.finalProbability).toBeLessThan(1);
  });

  it("est invariant par permutation des tests (Bayes commute)", () => {
    const swapped = runCascade(0.3, [DROP_ARM, JOBE]);
    expect(swapped.finalProbability).toBeCloseTo(result.finalProbability, 10);
  });
});

describe("runCascade - proprietes generales", () => {
  it("retourne initialProbability si aucun test n'est applique", () => {
    const result = runCascade(0.25, []);
    expect(result.finalProbability).toBe(0.25);
    expect(result.steps).toHaveLength(0);
  });

  it("est coherent avec computeLikelihoodRatios (Se/Sp -> LR)", () => {
    // On reconstruit les LR a partir des Se/Sp bruts et on verifie que la
    // cascade donne le meme resultat qu'avec les LR seed.
    const jobeLr = computeLikelihoodRatios({
      sensitivity: 0.69,
      specificity: 0.62,
    });
    const dropArmLr = computeLikelihoodRatios({
      sensitivity: 0.21,
      specificity: 0.92,
    });

    const fromSeSp = runCascade(0.3, [
      {
        testSlug: "empty-can-jobe",
        lrPositive: jobeLr.lrPositive,
        lrNegative: jobeLr.lrNegative,
        outcome: "positive",
      },
      {
        testSlug: "drop-arm",
        lrPositive: dropArmLr.lrPositive,
        lrNegative: dropArmLr.lrNegative,
        outcome: "positive",
      },
    ]);

    // Tolerance : les LR seed sont arrondis a 2 decimales.
    expect(fromSeSp.finalProbability).toBeCloseTo(0.6723, 2);
  });

  it("applique le LR- quand le test est negatif", () => {
    const result = runCascade(0.5, [{ ...JOBE, outcome: "negative" }]);
    // 0.5 odds=1 * 0.50 = 0.50 odds -> prob 0.50/1.50 = 0.333
    expect(result.steps[0]?.likelihoodRatio).toBe(JOBE.lrNegative);
    expect(result.finalProbability).toBeCloseTo(1 / 3, 4);
  });

  it("absorbe 0 : une fois la probabilite a 0, elle y reste", () => {
    const result = runCascade(0, [JOBE, DROP_ARM]);
    expect(result.finalProbability).toBe(0);
    expect(result.steps.every((s) => s.postTestProb === 0)).toBe(true);
  });

  it("absorbe 1 : une fois la probabilite a 1, elle y reste", () => {
    const result = runCascade(1, [
      { ...JOBE, outcome: "negative" },
      { ...DROP_ARM, outcome: "negative" },
    ]);
    expect(result.finalProbability).toBe(1);
  });

  it("rejette initialProbability hors [0, 1]", () => {
    expect(() => runCascade(-0.1, [])).toThrow(RangeError);
    expect(() => runCascade(1.01, [])).toThrow(RangeError);
    expect(() => runCascade(Number.NaN, [])).toThrow(RangeError);
  });

  it("descend progressivement quand on enchaine des LR- (tests negatifs)", () => {
    const result = runCascade(0.6, [
      { ...JOBE, outcome: "negative" },
      { ...DROP_ARM, outcome: "negative" },
    ]);
    expect(result.finalProbability).toBeLessThan(0.6);
    expect(result.finalProbability).toBeGreaterThan(0);
  });
});
