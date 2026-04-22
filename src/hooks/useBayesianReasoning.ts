// =============================================================================
// Evidence Kine - Hook : raisonnement bayesien derive des stores
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Combine :
//   - `useSimulationStore` : probabilite pre-test + tests realises
//   - un store de clinical_tests fourni en parametre (inject par defaut depuis
//     `@/store/defaults`, ou mock en test)
//
// Ne stocke rien : la probabilite post-test courante est **derivee** a chaque
// render via `runCascade`. Garantit une seule source de verite (le store) et
// evite toute desynchronisation UI <-> moteur.
//
// NOTE pedagogique : les clinical_tests de la DB peuvent ne pas avoir de
// LR+/- renseignes (nullables). Dans ce cas, le hook recalcule les LR a la
// volee a partir de Se/Sp via `computeLikelihoodRatios`. Les tests sans Se
// ni Sp sont ignores (ne peuvent pas contribuer au raisonnement).
// =============================================================================

import { useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";

import { computeLikelihoodRatios } from "@/logic/bayesian/likelihoodRatios";
import {
  runCascade,
  type CascadeResult,
  type CascadeStepInput,
} from "@/logic/bayesian/cascade";
import type { ClinicalTestsState } from "@/store/clinicalTestsStore";
import {
  useSimulationStore,
  type PerformedTest,
} from "@/store/simulationStore";
import type { ClinicalTest } from "@/types/database.types";

/**
 * Sortie du hook : resultat de la cascade + flag indiquant les tests realises
 * dont la metadonnee clinique n'a pas pu etre resolue (ex. slug absent du
 * store parce que la pathologie n'a pas encore ete chargee).
 */
export interface BayesianReasoningResult extends CascadeResult {
  unresolvedTestIds: string[];
}

/**
 * Resout un `PerformedTest` en `CascadeStepInput` en recuperant Se/Sp/LR
 * depuis la liste des clinical_tests du store. Retourne `null` si :
 *   - le test n'est pas trouve (pas encore charge, ou slug invalide),
 *   - Se ou Sp est manquant (donnee incomplete).
 */
function toCascadeStep(
  performed: PerformedTest,
  availableTests: readonly ClinicalTest[],
): CascadeStepInput | null {
  const clinicalTest = availableTests.find(
    (t) => t.id === performed.testId || t.slug === performed.testSlug,
  );
  if (!clinicalTest) return null;

  const { sensitivity, specificity } = clinicalTest;
  if (
    !Number.isFinite(sensitivity) ||
    !Number.isFinite(specificity) ||
    sensitivity < 0 ||
    sensitivity > 1 ||
    specificity < 0 ||
    specificity > 1
  ) {
    return null;
  }

  // On privilegie les LR seed (publies dans la meta-analyse source) si
  // disponibles ; sinon on recalcule a partir de Se/Sp.
  const derived = computeLikelihoodRatios({ sensitivity, specificity });
  const lrPositive =
    clinicalTest.lr_positive !== null &&
    Number.isFinite(clinicalTest.lr_positive) &&
    clinicalTest.lr_positive >= 0
      ? clinicalTest.lr_positive
      : derived.lrPositive;
  const lrNegative =
    clinicalTest.lr_negative !== null &&
    Number.isFinite(clinicalTest.lr_negative) &&
    clinicalTest.lr_negative >= 0
      ? clinicalTest.lr_negative
      : derived.lrNegative;

  return {
    testSlug: clinicalTest.slug,
    lrPositive,
    lrNegative,
    outcome: performed.outcome,
  };
}

/**
 * Options d'injection pour faciliter les tests unitaires.
 */
export interface UseBayesianReasoningOptions {
  clinicalTestsStore: UseBoundStore<StoreApi<ClinicalTestsState>>;
}

/**
 * Hook principal. Consomme `useSimulationStore` (store global) et un store
 * de clinical_tests injectable.
 */
export function useBayesianReasoning(
  options: UseBayesianReasoningOptions,
): BayesianReasoningResult {
  const preTestProbability = useSimulationStore((s) => s.preTestProbability);
  const pathologySlug = useSimulationStore((s) => s.pathologySlug);
  const testsPerformed = useSimulationStore((s) => s.testsPerformed);

  const availableTests = options.clinicalTestsStore((s) =>
    pathologySlug ? (s.testsByPathologySlug[pathologySlug] ?? []) : [],
  );

  return useMemo(
    () =>
      deriveBayesianReasoning(
        preTestProbability,
        testsPerformed,
        availableTests,
      ),
    [preTestProbability, testsPerformed, availableTests],
  );
}

/**
 * Fonction pure (sans hook) qui calcule le resultat bayesien. Exposee pour
 * etre testee directement sans monter React, et reutilisable hors hook.
 */
export function deriveBayesianReasoning(
  preTestProbability: number,
  testsPerformed: readonly PerformedTest[],
  availableTests: readonly ClinicalTest[],
): BayesianReasoningResult {
  const steps: CascadeStepInput[] = [];
  const unresolvedTestIds: string[] = [];

  for (const performed of testsPerformed) {
    const step = toCascadeStep(performed, availableTests);
    if (step === null) {
      unresolvedTestIds.push(performed.testId);
      continue;
    }
    steps.push(step);
  }

  const cascade = runCascade(preTestProbability, steps);

  return {
    ...cascade,
    unresolvedTestIds,
  };
}
