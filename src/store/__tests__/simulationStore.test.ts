import { beforeEach, describe, expect, it } from "vitest";

import { useSimulationStore } from "@/store/simulationStore";

// =============================================================================
// Evidence Kine - QA : simulationStore (etat vignette)
// =============================================================================

beforeEach(() => {
  useSimulationStore.getState().reset();
});

describe("useSimulationStore - startSimulation", () => {
  it("initialise le store avec les parametres fournis", () => {
    useSimulationStore.getState().startSimulation({
      pathologyId: "path-cuff",
      pathologySlug: "shoulder-rotator-cuff-tear",
      preTestProbability: 0.3,
    });

    const state = useSimulationStore.getState();
    expect(state.pathologyId).toBe("path-cuff");
    expect(state.pathologySlug).toBe("shoulder-rotator-cuff-tear");
    expect(state.preTestProbability).toBe(0.3);
    expect(state.testsPerformed).toEqual([]);
  });

  it("accepte les bornes 0 et 1", () => {
    useSimulationStore.getState().startSimulation({
      pathologyId: "a",
      pathologySlug: "a",
      preTestProbability: 0,
    });
    expect(useSimulationStore.getState().preTestProbability).toBe(0);

    useSimulationStore.getState().startSimulation({
      pathologyId: "b",
      pathologySlug: "b",
      preTestProbability: 1,
    });
    expect(useSimulationStore.getState().preTestProbability).toBe(1);
  });

  it("rejette preTestProbability hors [0, 1]", () => {
    expect(() =>
      useSimulationStore.getState().startSimulation({
        pathologyId: "x",
        pathologySlug: "x",
        preTestProbability: 1.5,
      }),
    ).toThrow(RangeError);

    expect(() =>
      useSimulationStore.getState().startSimulation({
        pathologyId: "x",
        pathologySlug: "x",
        preTestProbability: -0.1,
      }),
    ).toThrow(RangeError);

    expect(() =>
      useSimulationStore.getState().startSimulation({
        pathologyId: "x",
        pathologySlug: "x",
        preTestProbability: Number.NaN,
      }),
    ).toThrow(RangeError);
  });

  it("remet a zero les tests realises si une simulation etait en cours", () => {
    const store = useSimulationStore.getState();
    store.startSimulation({
      pathologyId: "a",
      pathologySlug: "a",
      preTestProbability: 0.3,
    });
    store.recordTestResult({
      testId: "t1",
      testSlug: "jobe",
      outcome: "positive",
    });
    store.startSimulation({
      pathologyId: "b",
      pathologySlug: "b",
      preTestProbability: 0.5,
    });

    expect(useSimulationStore.getState().testsPerformed).toEqual([]);
  });
});

describe("useSimulationStore - recordTestResult", () => {
  beforeEach(() => {
    useSimulationStore.getState().startSimulation({
      pathologyId: "path-cuff",
      pathologySlug: "shoulder-rotator-cuff-tear",
      preTestProbability: 0.3,
    });
  });

  it("ajoute un test a la liste", () => {
    useSimulationStore.getState().recordTestResult({
      testId: "t1",
      testSlug: "jobe",
      outcome: "positive",
    });
    expect(useSimulationStore.getState().testsPerformed).toHaveLength(1);
  });

  it("ajoute plusieurs tests dans l'ordre d'arrivee", () => {
    const store = useSimulationStore.getState();
    store.recordTestResult({
      testId: "t1",
      testSlug: "jobe",
      outcome: "positive",
    });
    store.recordTestResult({
      testId: "t2",
      testSlug: "drop-arm",
      outcome: "negative",
    });
    const tests = useSimulationStore.getState().testsPerformed;
    expect(tests.map((t) => t.testId)).toEqual(["t1", "t2"]);
  });

  it("ecrase le resultat si le meme testId est fourni deux fois (correction)", () => {
    const store = useSimulationStore.getState();
    store.recordTestResult({
      testId: "t1",
      testSlug: "jobe",
      outcome: "positive",
    });
    store.recordTestResult({
      testId: "t1",
      testSlug: "jobe",
      outcome: "negative",
    });
    const tests = useSimulationStore.getState().testsPerformed;
    expect(tests).toHaveLength(1);
    expect(tests[0]?.outcome).toBe("negative");
  });
});

describe("useSimulationStore - undoLastTest", () => {
  it("retire le dernier test enregistre", () => {
    const store = useSimulationStore.getState();
    store.startSimulation({
      pathologyId: "a",
      pathologySlug: "a",
      preTestProbability: 0.3,
    });
    store.recordTestResult({
      testId: "t1",
      testSlug: "jobe",
      outcome: "positive",
    });
    store.recordTestResult({
      testId: "t2",
      testSlug: "drop-arm",
      outcome: "positive",
    });
    store.undoLastTest();

    const tests = useSimulationStore.getState().testsPerformed;
    expect(tests).toHaveLength(1);
    expect(tests[0]?.testId).toBe("t1");
  });

  it("est un no-op si la liste est vide", () => {
    const store = useSimulationStore.getState();
    store.startSimulation({
      pathologyId: "a",
      pathologySlug: "a",
      preTestProbability: 0.3,
    });
    store.undoLastTest();
    expect(useSimulationStore.getState().testsPerformed).toEqual([]);
  });
});

describe("useSimulationStore - reset", () => {
  it("remet le store a l'etat initial", () => {
    const store = useSimulationStore.getState();
    store.startSimulation({
      pathologyId: "a",
      pathologySlug: "a",
      preTestProbability: 0.3,
    });
    store.recordTestResult({
      testId: "t1",
      testSlug: "jobe",
      outcome: "positive",
    });
    store.reset();

    const state = useSimulationStore.getState();
    expect(state.pathologyId).toBeNull();
    expect(state.pathologySlug).toBeNull();
    expect(state.preTestProbability).toBe(0);
    expect(state.testsPerformed).toEqual([]);
  });
});
