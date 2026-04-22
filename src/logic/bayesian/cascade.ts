// =============================================================================
// Evidence Kine - Moteur bayesien : cascade de tests (chainage des LR)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Chaine plusieurs tests cliniques en appliquant Bayes sur les odds :
//   la probabilite post-test du test n devient la probabilite pre-test
//   du test n+1.
//
// Hypothese pedagogique : independance conditionnelle des tests. En pratique
// clinique reelle, les tests sont souvent correles (p.ex. tests de coiffe
// explorant la meme fonction motrice), ce qui tend a surestimer la
// probabilite finale. Le Serious Game assume cette simplification et
// l'explicite dans l'affichage UI (cf. Sprint 5).
// =============================================================================

import { postTestProbability } from "./bayes";

/**
 * Resultat observe pour un test clinique :
 *   - "positive" : on multiplie par LR+.
 *   - "negative" : on multiplie par LR-.
 */
export type TestOutcome = "positive" | "negative";

/**
 * Une etape de la cascade : un test clinique + le resultat observe.
 *
 * Les deux LR sont exiges (et non Se/Sp) pour forcer le consommateur a
 * convertir en amont via `likelihoodRatios.ts`. Cela evite qu'un agent UI
 * combine des pourcentages bruts.
 *
 * @property testSlug - Identifiant stable du test (ex. "empty-can-jobe"). Sert
 *   a tracer le raisonnement et a l'affichage UI.
 * @property lrPositive - LR+ du test (>= 0, peut etre Infinity).
 * @property lrNegative - LR- du test (>= 0, peut etre Infinity).
 * @property outcome - Resultat observe par le clinicien.
 */
export interface CascadeStepInput {
  testSlug: string;
  lrPositive: number;
  lrNegative: number;
  outcome: TestOutcome;
}

/**
 * Etape detaillee du raisonnement bayesien, pour affichage pedagogique
 * (cf. Sprint 5 : "pre-test -> LR applique -> post-test").
 */
export interface CascadeStepResult {
  testSlug: string;
  preTestProb: number;
  outcome: TestOutcome;
  likelihoodRatio: number;
  postTestProb: number;
}

/**
 * Resultat complet d'une cascade bayesienne.
 */
export interface CascadeResult {
  initialProbability: number;
  finalProbability: number;
  steps: CascadeStepResult[];
}

/**
 * Applique une cascade de tests cliniques a partir d'une probabilite pre-test.
 *
 * Chaque test consomme la probabilite courante comme pre-test, et produit la
 * nouvelle probabilite post-test via `postTestProbability`. Les etapes sont
 * tracees pour l'affichage du raisonnement.
 *
 * Si `steps` est vide, la probabilite finale egale la probabilite initiale.
 *
 * @param initialProbability - Probabilite pre-test initiale, dans [0, 1].
 *   Typiquement la prevalence de la pathologie suspectee dans la population
 *   cible (ex. 0.30 pour une rupture de coiffe chez un homme de 52 ans).
 * @param steps - Tests cliniques appliques, dans l'ordre chronologique de
 *   l'examen.
 * @throws RangeError si `initialProbability` est hors [0, 1] ou si un LR est
 *   invalide (propage depuis `postTestProbability`).
 */
export function runCascade(
  initialProbability: number,
  steps: readonly CascadeStepInput[],
): CascadeResult {
  if (
    !Number.isFinite(initialProbability) ||
    initialProbability < 0 ||
    initialProbability > 1
  ) {
    throw new RangeError(
      `initialProbability doit etre dans [0, 1], recu : ${initialProbability}`,
    );
  }

  const traced: CascadeStepResult[] = [];
  let currentProb = initialProbability;

  for (const step of steps) {
    const lr = step.outcome === "positive" ? step.lrPositive : step.lrNegative;
    const postProb = postTestProbability(currentProb, lr);

    traced.push({
      testSlug: step.testSlug,
      preTestProb: currentProb,
      outcome: step.outcome,
      likelihoodRatio: lr,
      postTestProb: postProb,
    });

    currentProb = postProb;
  }

  return {
    initialProbability,
    finalProbability: currentProb,
    steps: traced,
  };
}
