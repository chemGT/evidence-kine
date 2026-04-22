import { describe, expect, it } from "vitest";

import {
  ClinicalTestsRepoError,
  createClinicalTestsRepository,
} from "@/data/repositories/clinicalTestsRepo";
import type {
  BodyRegion,
  ClinicalTest,
  Pathology,
} from "@/types/database.types";

import { createSupabaseClientMock } from "./supabaseMock";

// =============================================================================
// Evidence Kine - QA : clinicalTestsRepo (mock Supabase)
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
  label_en: "Rotator cuff tear",
  icd10_code: "M75.1",
  description: null,
  created_at: "2026-04-20T00:00:00Z",
};

const JOBE_TEST: ClinicalTest = {
  id: "test-jobe",
  pathology_id: CUFF_PATHOLOGY.id,
  slug: "empty-can-jobe",
  name_fr: "Test d'Empty Can (Jobe)",
  name_en: "Empty Can test (Jobe)",
  procedure_description: "Bras en abduction 90deg...",
  sensitivity: 0.69,
  specificity: 0.62,
  lr_positive: 1.82,
  lr_negative: 0.5,
  evidence_level: "2a",
  source_doi: "10.1136/bjsports-2012-091066",
  source_reference: "Hegedus EJ et al., BJSM 2012",
  created_at: "2026-04-20T00:00:00Z",
};

describe("createClinicalTestsRepository", () => {
  describe("fetchBodyRegion", () => {
    it("retourne la region si elle existe", async () => {
      const client = createSupabaseClientMock({
        body_regions: [SHOULDER_REGION],
      });
      const repo = createClinicalTestsRepository(client);
      const region = await repo.fetchBodyRegion("shoulder");
      expect(region).toEqual(SHOULDER_REGION);
    });

    it("retourne null si la region n'existe pas", async () => {
      const client = createSupabaseClientMock({
        body_regions: [SHOULDER_REGION],
      });
      const repo = createClinicalTestsRepository(client);
      const region = await repo.fetchBodyRegion("unknown");
      expect(region).toBeNull();
    });

    it("propage une ClinicalTestsRepoError en cas d'erreur Supabase", async () => {
      const client = createSupabaseClientMock(
        { body_regions: [SHOULDER_REGION] },
        { body_regions: "RLS denied" },
      );
      const repo = createClinicalTestsRepository(client);
      await expect(repo.fetchBodyRegion("shoulder")).rejects.toThrow(
        ClinicalTestsRepoError,
      );
    });
  });

  describe("fetchPathologiesByRegion", () => {
    it("retourne les pathologies de la region", async () => {
      const client = createSupabaseClientMock({
        body_regions: [SHOULDER_REGION],
        pathologies: [CUFF_PATHOLOGY],
      });
      const repo = createClinicalTestsRepository(client);
      const result = await repo.fetchPathologiesByRegion("shoulder");
      expect(result).toEqual([CUFF_PATHOLOGY]);
    });

    it("retourne [] si la region n'existe pas", async () => {
      const client = createSupabaseClientMock({
        body_regions: [],
        pathologies: [CUFF_PATHOLOGY],
      });
      const repo = createClinicalTestsRepository(client);
      const result = await repo.fetchPathologiesByRegion("unknown");
      expect(result).toEqual([]);
    });

    it("propage l'erreur si pathologies plante", async () => {
      const client = createSupabaseClientMock(
        {
          body_regions: [SHOULDER_REGION],
          pathologies: [CUFF_PATHOLOGY],
        },
        { pathologies: "boom" },
      );
      const repo = createClinicalTestsRepository(client);
      await expect(repo.fetchPathologiesByRegion("shoulder")).rejects.toThrow(
        ClinicalTestsRepoError,
      );
    });
  });

  describe("fetchClinicalTestsByPathology", () => {
    it("retourne les tests cliniques de la pathologie", async () => {
      const client = createSupabaseClientMock({
        pathologies: [CUFF_PATHOLOGY],
        clinical_tests: [JOBE_TEST],
      });
      const repo = createClinicalTestsRepository(client);
      const result = await repo.fetchClinicalTestsByPathology(
        "shoulder-rotator-cuff-tear",
      );
      expect(result).toEqual([JOBE_TEST]);
    });

    it("retourne [] si la pathologie n'existe pas", async () => {
      const client = createSupabaseClientMock({
        pathologies: [],
        clinical_tests: [JOBE_TEST],
      });
      const repo = createClinicalTestsRepository(client);
      const result = await repo.fetchClinicalTestsByPathology("unknown");
      expect(result).toEqual([]);
    });

    it("propage l'erreur de resolution pathology", async () => {
      const client = createSupabaseClientMock(
        { pathologies: [CUFF_PATHOLOGY] },
        { pathologies: "denied" },
      );
      const repo = createClinicalTestsRepository(client);
      await expect(
        repo.fetchClinicalTestsByPathology("shoulder-rotator-cuff-tear"),
      ).rejects.toThrow(ClinicalTestsRepoError);
    });

    it("propage l'erreur de lecture clinical_tests", async () => {
      const client = createSupabaseClientMock(
        {
          pathologies: [CUFF_PATHOLOGY],
          clinical_tests: [JOBE_TEST],
        },
        { clinical_tests: "read error" },
      );
      const repo = createClinicalTestsRepository(client);
      await expect(
        repo.fetchClinicalTestsByPathology("shoulder-rotator-cuff-tear"),
      ).rejects.toThrow(ClinicalTestsRepoError);
    });
  });
});

describe("createClinicalTestsRepository - fallback data null -> []", () => {
  it("pathologies : retourne [] si Supabase renvoie data=null sans erreur", async () => {
    const client = {
      from: (table: string) => {
        if (table === "body_regions") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: SHOULDER_REGION,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "pathologies") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({ data: null, error: null }),
              }),
            }),
          };
        }
        throw new Error(`table ${table} non mockee`);
      },
    };
    const repo = createClinicalTestsRepository(
      client as unknown as Parameters<typeof createClinicalTestsRepository>[0],
    );
    const result = await repo.fetchPathologiesByRegion("shoulder");
    expect(result).toEqual([]);
  });

  it("clinical_tests : retourne [] si Supabase renvoie data=null sans erreur", async () => {
    const client = {
      from: (table: string) => {
        if (table === "pathologies") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: CUFF_PATHOLOGY.id },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "clinical_tests") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({ data: null, error: null }),
              }),
            }),
          };
        }
        throw new Error(`table ${table} non mockee`);
      },
    };
    const repo = createClinicalTestsRepository(
      client as unknown as Parameters<typeof createClinicalTestsRepository>[0],
    );
    const result = await repo.fetchClinicalTestsByPathology(
      "shoulder-rotator-cuff-tear",
    );
    expect(result).toEqual([]);
  });
});

describe("ClinicalTestsRepoError", () => {
  it("conserve la cause originale", () => {
    const cause = new Error("root cause");
    const err = new ClinicalTestsRepoError("wrapped", cause);
    expect(err.name).toBe("ClinicalTestsRepoError");
    expect(err.cause).toBe(cause);
    expect(err.message).toBe("wrapped");
  });

  it("accepte une absence de cause", () => {
    const err = new ClinicalTestsRepoError("no cause");
    expect(err.cause).toBeUndefined();
  });
});
