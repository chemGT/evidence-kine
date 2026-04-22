import { describe, it, expect } from "vitest";

import {
  postTestProbability,
  probabilityToOdds,
  oddsToProbability,
} from "../bayes";
import { computeLikelihoodRatios } from "../likelihoodRatios";

// =============================================================================
// Evidence Kine - QA : moteur bayesien (LR + post-test probability)
// -----------------------------------------------------------------------------
// Couvre les cas limites exiges par @qa (rules/qa-agent.md) :
//   - Se = 0 ou 1, Sp = 0 ou 1
//   - preTestProb = 0 ou 1
//   - LR = 0, 1, Infinity
//   - validation du domaine [0, 1] et detection des NaN
// =============================================================================

describe("computeLikelihoodRatios (Se/Sp -> LR+/LR-)", () => {
  it("calcule LR+ et LR- sur un cas clinique reel (Empty Can / Jobe)", () => {
    // Source : Hegedus EJ et al., BJSM 2012 - seed shoulder_tests.sql
    const { lrPositive, lrNegative } = computeLikelihoodRatios({
      sensitivity: 0.69,
      specificity: 0.62,
    });

    expect(lrPositive).toBeCloseTo(0.69 / 0.38, 4);
    expect(lrNegative).toBeCloseTo(0.31 / 0.62, 4);
  });

  it("retourne LR+ = Infinity quand Sp = 1 (test parfaitement specifique)", () => {
    const { lrPositive, lrNegative } = computeLikelihoodRatios({
      sensitivity: 0.8,
      specificity: 1,
    });

    expect(lrPositive).toBe(Number.POSITIVE_INFINITY);
    expect(lrNegative).toBeCloseTo(0.2, 6);
  });

  it("retourne LR- = 0 quand Se = 1 (test parfaitement sensible)", () => {
    const { lrPositive, lrNegative } = computeLikelihoodRatios({
      sensitivity: 1,
      specificity: 0.5,
    });

    expect(lrPositive).toBeCloseTo(1 / 0.5, 6);
    expect(lrNegative).toBe(0);
  });

  it("retourne LR+ = 0 quand Se = 0", () => {
    const { lrPositive } = computeLikelihoodRatios({
      sensitivity: 0,
      specificity: 0.8,
    });
    expect(lrPositive).toBe(0);
  });

  it("retourne LR- = Infinity quand Sp = 0", () => {
    const { lrNegative } = computeLikelihoodRatios({
      sensitivity: 0.8,
      specificity: 0,
    });
    expect(lrNegative).toBe(Number.POSITIVE_INFINITY);
  });

  it("retourne LR+ = LR- = 1 quand Se = Sp = 0.5 (test non informatif)", () => {
    const { lrPositive, lrNegative } = computeLikelihoodRatios({
      sensitivity: 0.5,
      specificity: 0.5,
    });
    expect(lrPositive).toBe(1);
    expect(lrNegative).toBe(1);
  });

  it("rejette une sensibilite hors [0, 1]", () => {
    expect(() =>
      computeLikelihoodRatios({ sensitivity: 1.2, specificity: 0.5 }),
    ).toThrow(RangeError);
    expect(() =>
      computeLikelihoodRatios({ sensitivity: -0.1, specificity: 0.5 }),
    ).toThrow(RangeError);
  });

  it("rejette une specificite hors [0, 1]", () => {
    expect(() =>
      computeLikelihoodRatios({ sensitivity: 0.5, specificity: 2 }),
    ).toThrow(RangeError);
  });

  it("rejette NaN", () => {
    expect(() =>
      computeLikelihoodRatios({ sensitivity: Number.NaN, specificity: 0.5 }),
    ).toThrow(RangeError);
    expect(() =>
      computeLikelihoodRatios({ sensitivity: 0.5, specificity: Number.NaN }),
    ).toThrow(RangeError);
  });
});

describe("probabilityToOdds / oddsToProbability", () => {
  it("convertit 0.5 <-> 1 (odds neutres)", () => {
    expect(probabilityToOdds(0.5)).toBe(1);
    expect(oddsToProbability(1)).toBe(0.5);
  });

  it("retourne Infinity pour p = 1", () => {
    expect(probabilityToOdds(1)).toBe(Number.POSITIVE_INFINITY);
  });

  it("retourne 0 pour p = 0", () => {
    expect(probabilityToOdds(0)).toBe(0);
    expect(oddsToProbability(0)).toBe(0);
  });

  it("oddsToProbability(Infinity) = 1", () => {
    expect(oddsToProbability(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it("est reversible sur valeurs courantes", () => {
    for (const p of [0.1, 0.25, 0.3, 0.5, 0.75, 0.9]) {
      const roundTrip = oddsToProbability(probabilityToOdds(p));
      expect(roundTrip).toBeCloseTo(p, 10);
    }
  });

  it("rejette probability hors [0, 1]", () => {
    expect(() => probabilityToOdds(-0.1)).toThrow(RangeError);
    expect(() => probabilityToOdds(1.1)).toThrow(RangeError);
    expect(() => probabilityToOdds(Number.NaN)).toThrow(RangeError);
  });

  it("rejette odds < 0 ou NaN", () => {
    expect(() => oddsToProbability(-1)).toThrow(RangeError);
    expect(() => oddsToProbability(Number.NaN)).toThrow(RangeError);
  });
});

describe("postTestProbability (Bayes sur les odds)", () => {
  it("calcule correctement un cas clinique classique (prior 30 %, LR+ 1.82)", () => {
    // Coiffe prior 30 % + Jobe + (LR+ = 1.82)
    // pre_odds = 0.3 / 0.7 = 0.4286
    // post_odds = 0.4286 * 1.82 = 0.7800
    // post_prob = 0.7800 / 1.7800 = 0.4382
    const post = postTestProbability(0.3, 1.82);
    expect(post).toBeCloseTo(0.4382, 3);
  });

  it("ne modifie pas la probabilite si LR = 1 (test non informatif)", () => {
    expect(postTestProbability(0.3, 1)).toBeCloseTo(0.3, 10);
    expect(postTestProbability(0.7, 1)).toBeCloseTo(0.7, 10);
  });

  it("retourne 0 si preTestProb = 0 (aucune probabilite a priori)", () => {
    expect(postTestProbability(0, 100)).toBe(0);
    expect(postTestProbability(0, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("retourne 1 si preTestProb = 1 (certitude a priori)", () => {
    expect(postTestProbability(1, 0.01)).toBe(1);
    expect(postTestProbability(1, 0)).toBe(1);
  });

  it("retourne 0 si LR = 0 (test parfaitement eliminatoire)", () => {
    expect(postTestProbability(0.5, 0)).toBe(0);
    expect(postTestProbability(0.9, 0)).toBe(0);
  });

  it("retourne 1 si LR = Infinity (test parfaitement confirmatoire)", () => {
    expect(postTestProbability(0.5, Number.POSITIVE_INFINITY)).toBe(1);
    expect(postTestProbability(0.01, Number.POSITIVE_INFINITY)).toBe(1);
  });

  it("diminue la probabilite quand on applique un LR- (< 1)", () => {
    const post = postTestProbability(0.5, 0.3);
    expect(post).toBeLessThan(0.5);
    expect(post).toBeGreaterThan(0);
  });

  it("augmente la probabilite quand on applique un LR+ (> 1)", () => {
    const post = postTestProbability(0.5, 5);
    expect(post).toBeGreaterThan(0.5);
    expect(post).toBeLessThan(1);
  });

  it("rejette preTestProb hors [0, 1]", () => {
    expect(() => postTestProbability(-0.1, 1)).toThrow(RangeError);
    expect(() => postTestProbability(1.1, 1)).toThrow(RangeError);
    expect(() => postTestProbability(Number.NaN, 1)).toThrow(RangeError);
  });

  it("rejette LR < 0 ou NaN", () => {
    expect(() => postTestProbability(0.5, -0.1)).toThrow(RangeError);
    expect(() => postTestProbability(0.5, Number.NaN)).toThrow(RangeError);
  });
});
