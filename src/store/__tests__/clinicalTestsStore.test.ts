import { describe, expect, it, vi } from "vitest";

import type { ClinicalTestsRepository } from "@/data/repositories/clinicalTestsRepo";
import { createClinicalTestsStore } from "@/store/clinicalTestsStore";
import type {
  BodyRegion,
  ClinicalTest,
  Pathology,
} from "@/types/database.types";

// =============================================================================
// Evidence Kine - QA : clinicalTestsStore (cache Zustand)
// =============================================================================

const SHOULDER_REGION: BodyRegion = {
  id: "reg-shoulder",
  slug: "shoulder",
  label_fr: "Epaule",
  label_en: "Shoulder",
  created_at: "2026-04-20T00:00:00Z",
};

const CUFF_PATHOLOGY: Pathology = {
  id: "path-cuff",
  body_region_id: SHOULDER_REGION.id,
  slug: "shoulder-rotator-cuff-tear",
  label_fr: "Rupture de la coiffe",
  label_en: null,
  icd10_code: null,
  description: null,
  created_at: "2026-04-20T00:00:00Z",
};

const JOBE_TEST: ClinicalTest = {
  id: "test-jobe",
  pathology_id: CUFF_PATHOLOGY.id,
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

function createMockRepo(
  overrides: Partial<ClinicalTestsRepository> = {},
): ClinicalTestsRepository {
  return {
    fetchBodyRegion: vi.fn().mockResolvedValue(SHOULDER_REGION),
    fetchPathologiesByRegion: vi.fn().mockResolvedValue([CUFF_PATHOLOGY]),
    fetchClinicalTestsByPathology: vi.fn().mockResolvedValue([JOBE_TEST]),
    ...overrides,
  };
}

describe("clinicalTestsStore - loadPathologiesForRegion", () => {
  it("charge et cache les pathologies", async () => {
    const repo = createMockRepo();
    const useStore = createClinicalTestsStore(repo);

    const result = await useStore
      .getState()
      .loadPathologiesForRegion("shoulder");

    expect(result).toEqual([CUFF_PATHOLOGY]);
    expect(useStore.getState().pathologiesByRegionSlug.shoulder).toEqual([
      CUFF_PATHOLOGY,
    ]);
    expect(useStore.getState().loadingPathologiesRegion.shoulder).toBe(false);
    expect(useStore.getState().errorsPathologiesRegion.shoulder).toBeNull();
  });

  it("ne rappelle pas le repo si les donnees sont en cache", async () => {
    const repo = createMockRepo();
    const useStore = createClinicalTestsStore(repo);

    await useStore.getState().loadPathologiesForRegion("shoulder");
    await useStore.getState().loadPathologiesForRegion("shoulder");
    await useStore.getState().loadPathologiesForRegion("shoulder");

    expect(repo.fetchPathologiesByRegion).toHaveBeenCalledTimes(1);
  });

  it("recharge si reload=true", async () => {
    const repo = createMockRepo();
    const useStore = createClinicalTestsStore(repo);

    await useStore.getState().loadPathologiesForRegion("shoulder");
    await useStore
      .getState()
      .loadPathologiesForRegion("shoulder", { reload: true });

    expect(repo.fetchPathologiesByRegion).toHaveBeenCalledTimes(2);
  });

  it("capture l'erreur dans errorsPathologiesRegion et propage", async () => {
    const repo = createMockRepo({
      fetchPathologiesByRegion: vi.fn().mockRejectedValue(new Error("boom")),
    });
    const useStore = createClinicalTestsStore(repo);

    await expect(
      useStore.getState().loadPathologiesForRegion("shoulder"),
    ).rejects.toThrow("boom");

    expect(useStore.getState().errorsPathologiesRegion.shoulder).toBe("boom");
    expect(useStore.getState().loadingPathologiesRegion.shoulder).toBe(false);
  });

  it("gere une erreur non-Error (string brut)", async () => {
    const repo = createMockRepo({
      fetchPathologiesByRegion: vi.fn().mockRejectedValue("string-error"),
    });
    const useStore = createClinicalTestsStore(repo);

    await expect(
      useStore.getState().loadPathologiesForRegion("shoulder"),
    ).rejects.toBe("string-error");
    expect(useStore.getState().errorsPathologiesRegion.shoulder).toBe(
      "string-error",
    );
  });
});

describe("clinicalTestsStore - loadTestsForPathology", () => {
  it("charge et cache les tests par slug de pathologie", async () => {
    const repo = createMockRepo();
    const useStore = createClinicalTestsStore(repo);

    const tests = await useStore
      .getState()
      .loadTestsForPathology("shoulder-rotator-cuff-tear");

    expect(tests).toEqual([JOBE_TEST]);
    expect(
      useStore.getState().testsByPathologySlug["shoulder-rotator-cuff-tear"],
    ).toEqual([JOBE_TEST]);
  });

  it("ne rappelle pas le repo si en cache", async () => {
    const repo = createMockRepo();
    const useStore = createClinicalTestsStore(repo);

    await useStore
      .getState()
      .loadTestsForPathology("shoulder-rotator-cuff-tear");
    await useStore
      .getState()
      .loadTestsForPathology("shoulder-rotator-cuff-tear");

    expect(repo.fetchClinicalTestsByPathology).toHaveBeenCalledTimes(1);
  });

  it("recharge si reload=true", async () => {
    const repo = createMockRepo();
    const useStore = createClinicalTestsStore(repo);

    await useStore
      .getState()
      .loadTestsForPathology("shoulder-rotator-cuff-tear");
    await useStore
      .getState()
      .loadTestsForPathology("shoulder-rotator-cuff-tear", { reload: true });

    expect(repo.fetchClinicalTestsByPathology).toHaveBeenCalledTimes(2);
  });

  it("capture et propage une erreur", async () => {
    const repo = createMockRepo({
      fetchClinicalTestsByPathology: vi
        .fn()
        .mockRejectedValue(new Error("denied")),
    });
    const useStore = createClinicalTestsStore(repo);

    await expect(
      useStore.getState().loadTestsForPathology("shoulder-rotator-cuff-tear"),
    ).rejects.toThrow("denied");

    expect(
      useStore.getState().errorsTestsPathology["shoulder-rotator-cuff-tear"],
    ).toBe("denied");
  });

  it("gere une erreur non-Error sur tests", async () => {
    const repo = createMockRepo({
      fetchClinicalTestsByPathology: vi.fn().mockRejectedValue(42),
    });
    const useStore = createClinicalTestsStore(repo);

    await expect(
      useStore.getState().loadTestsForPathology("shoulder-rotator-cuff-tear"),
    ).rejects.toBe(42);
    expect(
      useStore.getState().errorsTestsPathology["shoulder-rotator-cuff-tear"],
    ).toBe("42");
  });
});

describe("clinicalTestsStore - reset", () => {
  it("vide tout le cache", async () => {
    const repo = createMockRepo();
    const useStore = createClinicalTestsStore(repo);

    await useStore.getState().loadPathologiesForRegion("shoulder");
    await useStore
      .getState()
      .loadTestsForPathology("shoulder-rotator-cuff-tear");

    useStore.getState().reset();

    const state = useStore.getState();
    expect(state.pathologiesByRegionSlug).toEqual({});
    expect(state.testsByPathologySlug).toEqual({});
    expect(state.errorsPathologiesRegion).toEqual({});
    expect(state.errorsTestsPathology).toEqual({});
  });
});

describe("clinicalTestsStore - in-flight dedup", () => {
  it("retourne le cache courant si un chargement est deja en vol (pathologies)", async () => {
    let resolveFirst: (value: Pathology[]) => void = () => undefined;
    const repo = createMockRepo({
      fetchPathologiesByRegion: vi.fn().mockImplementation(
        () =>
          new Promise<Pathology[]>((resolve) => {
            resolveFirst = resolve;
          }),
      ),
    });
    const useStore = createClinicalTestsStore(repo);

    const p1 = useStore.getState().loadPathologiesForRegion("shoulder");
    const p2 = useStore.getState().loadPathologiesForRegion("shoulder");

    resolveFirst([CUFF_PATHOLOGY]);
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual([CUFF_PATHOLOGY]);
    // Le 2e appel a ete dedoublonne (aucun cache au moment du check) : renvoie [].
    expect(r2).toEqual([]);
    expect(repo.fetchPathologiesByRegion).toHaveBeenCalledTimes(1);
  });

  it("retourne le cache courant si un chargement est deja en vol (tests)", async () => {
    let resolveFirst: (value: ClinicalTest[]) => void = () => undefined;
    const repo = createMockRepo({
      fetchClinicalTestsByPathology: vi.fn().mockImplementation(
        () =>
          new Promise<ClinicalTest[]>((resolve) => {
            resolveFirst = resolve;
          }),
      ),
    });
    const useStore = createClinicalTestsStore(repo);

    const p1 = useStore.getState().loadTestsForPathology("cuff");
    const p2 = useStore.getState().loadTestsForPathology("cuff");

    resolveFirst([JOBE_TEST]);
    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual([JOBE_TEST]);
    expect(r2).toEqual([]);
    expect(repo.fetchClinicalTestsByPathology).toHaveBeenCalledTimes(1);
  });
});
