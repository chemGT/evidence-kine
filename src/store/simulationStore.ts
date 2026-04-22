// =============================================================================
// Evidence Kine - Store Zustand : etat d'une simulation (vignette)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Etat d'une vignette en cours :
//   - pathology vise (slug + id)
//   - probabilite pre-test initiale (prevalence dans le contexte de la vignette)
//   - liste ordonnee des tests deja realises et leur resultat
//
// La probabilite post-test courante n'est PAS stockee ici : elle est derivee
// via `useBayesianReasoning` qui combine ce store + `clinicalTestsStore` +
// `runCascade`. Principe : single source of truth = le raisonnement bayesien
// est un calcul, pas un etat persiste.
// =============================================================================

import { create } from "zustand";

import type { TestOutcome } from "@/logic/bayesian/cascade";

/**
 * Resultat d'un test realise pendant la simulation.
 *
 * @property testId - UUID du clinical_test (cle primaire DB, stable).
 * @property testSlug - Slug humain ("empty-can-jobe"), redondant mais pratique
 *   pour le debug et le trace bayesien.
 * @property outcome - Resultat observe par le clinicien.
 */
export interface PerformedTest {
  testId: string;
  testSlug: string;
  outcome: TestOutcome;
}

/**
 * Etat public du store de simulation.
 */
export interface SimulationState {
  pathologyId: string | null;
  pathologySlug: string | null;
  preTestProbability: number;
  testsPerformed: PerformedTest[];

  /**
   * Initialise une nouvelle simulation. Remet a zero toute simulation en
   * cours. Lance une erreur si la prevalence est hors [0, 1] pour aligner
   * avec les contraintes du moteur bayesien.
   */
  startSimulation(params: {
    pathologyId: string;
    pathologySlug: string;
    preTestProbability: number;
  }): void;

  /**
   * Enregistre le resultat d'un test. Si le meme `testId` est fourni deux
   * fois, le dernier resultat ecrase le precedent (le clinicien peut corriger
   * une erreur de saisie).
   */
  recordTestResult(test: PerformedTest): void;

  /**
   * Annule le dernier test enregistre. Utile pour un bouton "Annuler" UI.
   * No-op si la liste est vide.
   */
  undoLastTest(): void;

  /**
   * Remet le store a son etat initial (aucune simulation active).
   */
  reset(): void;
}

const INITIAL_STATE: Omit<
  SimulationState,
  "startSimulation" | "recordTestResult" | "undoLastTest" | "reset"
> = {
  pathologyId: null,
  pathologySlug: null,
  preTestProbability: 0,
  testsPerformed: [],
};

export const useSimulationStore = create<SimulationState>((set) => ({
  ...INITIAL_STATE,

  startSimulation: ({ pathologyId, pathologySlug, preTestProbability }) => {
    if (
      !Number.isFinite(preTestProbability) ||
      preTestProbability < 0 ||
      preTestProbability > 1
    ) {
      throw new RangeError(
        `preTestProbability doit etre dans [0, 1], recu : ${preTestProbability}`,
      );
    }
    set({
      pathologyId,
      pathologySlug,
      preTestProbability,
      testsPerformed: [],
    });
  },

  recordTestResult: (test) => {
    set((state) => {
      const existingIdx = state.testsPerformed.findIndex(
        (t) => t.testId === test.testId,
      );
      if (existingIdx === -1) {
        return { testsPerformed: [...state.testsPerformed, test] };
      }
      const updated = state.testsPerformed.slice();
      updated[existingIdx] = test;
      return { testsPerformed: updated };
    });
  },

  undoLastTest: () => {
    set((state) => {
      if (state.testsPerformed.length === 0) return state;
      return { testsPerformed: state.testsPerformed.slice(0, -1) };
    });
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
