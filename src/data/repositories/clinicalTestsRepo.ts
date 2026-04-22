// =============================================================================
// Evidence Kine - Repository : clinical_tests / pathologies / body_regions
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Repository en factory pour permettre l'injection d'un SupabaseClient de
// test (cf. tests Vitest avec createSupabaseClientMock). L'instance par
// defaut exposee en bas de fichier pointe vers le client prod de
// `@/lib/supabase`.
//
// Ne fait QUE du fetch/read (RLS publique anon sur `select` pour ces 3 tables,
// cf. 001_shoulder_tests.sql). Aucun ecriture, aucune manipulation de donnees
// de patient.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  BodyRegion,
  ClinicalTest,
  Database,
  Pathology,
} from "@/types/database.types";

/**
 * Client Supabase type-safe sur notre schema `public`.
 */
export type EvidenceKineSupabaseClient = SupabaseClient<Database>;

/**
 * Surface publique du repository. Toute consommatrice (store, hook, UI) ne
 * depend que de cette interface, jamais directement de `@supabase/supabase-js`.
 */
export interface ClinicalTestsRepository {
  fetchBodyRegion(slug: string): Promise<BodyRegion | null>;
  fetchPathologiesByRegion(regionSlug: string): Promise<Pathology[]>;
  fetchClinicalTestsByPathology(pathologySlug: string): Promise<ClinicalTest[]>;
}

/**
 * Erreur specifique du repository. Encapsule les erreurs Supabase pour ne pas
 * laisser fuiter les details de transport dans la couche superieure.
 */
export class ClinicalTestsRepoError extends Error {
  public readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ClinicalTestsRepoError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Construit un repository a partir d'un client Supabase. Aucun effet de bord
 * au moment de la construction : la connexion est lazy (premier appel async).
 */
export function createClinicalTestsRepository(
  client: EvidenceKineSupabaseClient,
): ClinicalTestsRepository {
  return {
    async fetchBodyRegion(slug: string): Promise<BodyRegion | null> {
      const { data, error } = await client
        .from("body_regions")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw new ClinicalTestsRepoError(
          `Impossible de charger la region "${slug}" : ${error.message}`,
          error,
        );
      }
      return data;
    },

    async fetchPathologiesByRegion(regionSlug: string): Promise<Pathology[]> {
      const region = await this.fetchBodyRegion(regionSlug);
      if (!region) return [];

      const { data, error } = await client
        .from("pathologies")
        .select("*")
        .eq("body_region_id", region.id)
        .order("label_fr", { ascending: true });

      if (error) {
        throw new ClinicalTestsRepoError(
          `Impossible de charger les pathologies de "${regionSlug}" : ${error.message}`,
          error,
        );
      }
      return data ?? [];
    },

    async fetchClinicalTestsByPathology(
      pathologySlug: string,
    ): Promise<ClinicalTest[]> {
      const { data: pathology, error: pathologyError } = await client
        .from("pathologies")
        .select("id")
        .eq("slug", pathologySlug)
        .maybeSingle();

      if (pathologyError) {
        throw new ClinicalTestsRepoError(
          `Impossible de resoudre la pathologie "${pathologySlug}" : ${pathologyError.message}`,
          pathologyError,
        );
      }
      if (!pathology) return [];

      const { data, error } = await client
        .from("clinical_tests")
        .select("*")
        .eq("pathology_id", pathology.id)
        .order("name_fr", { ascending: true });

      if (error) {
        throw new ClinicalTestsRepoError(
          `Impossible de charger les tests de "${pathologySlug}" : ${error.message}`,
          error,
        );
      }
      return data ?? [];
    },
  };
}
