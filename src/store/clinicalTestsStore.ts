// =============================================================================
// Evidence Kine - Store Zustand : cache des tests cliniques par pathologie
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Cache memoire des donnees readonly lues depuis Supabase :
//   - pathologies par region
//   - clinical_tests par pathology
//
// Les actions sont idempotentes : si la donnee est deja en cache, aucun
// nouvel appel Supabase n'est emis (sauf `reload* = true`). Evite les
// waterfalls de requetes dans une page qui rend plusieurs composants.
//
// Instance par defaut en bas de fichier = branchee sur le client prod.
// Les tests utilisent `createClinicalTestsStore(repo)` avec un repo mock.
// =============================================================================

import { create, type StoreApi, type UseBoundStore } from "zustand";

import type { ClinicalTestsRepository } from "@/data/repositories/clinicalTestsRepo";
import type { ClinicalTest, Pathology } from "@/types/database.types";

export interface ClinicalTestsState {
  pathologiesByRegionSlug: Record<string, Pathology[]>;
  testsByPathologySlug: Record<string, ClinicalTest[]>;

  /** Pathologies / tests en cours de chargement, keyees par slug. */
  loadingPathologiesRegion: Record<string, boolean>;
  loadingTestsPathology: Record<string, boolean>;

  /** Derniere erreur de chargement, par cle. `null` = pas d'erreur. */
  errorsPathologiesRegion: Record<string, string | null>;
  errorsTestsPathology: Record<string, string | null>;

  loadPathologiesForRegion(
    regionSlug: string,
    options?: { reload?: boolean },
  ): Promise<Pathology[]>;

  loadTestsForPathology(
    pathologySlug: string,
    options?: { reload?: boolean },
  ): Promise<ClinicalTest[]>;

  reset(): void;
}

/**
 * Construit un hook Zustand backe par un repository fourni (DI). A utiliser
 * dans les tests avec un mock de repo, ou pour composer une instance
 * personnalisee (ex. client Supabase avec JWT utilisateur).
 */
export function createClinicalTestsStore(
  repo: ClinicalTestsRepository,
): UseBoundStore<StoreApi<ClinicalTestsState>> {
  const initial: Omit<
    ClinicalTestsState,
    "loadPathologiesForRegion" | "loadTestsForPathology" | "reset"
  > = {
    pathologiesByRegionSlug: {},
    testsByPathologySlug: {},
    loadingPathologiesRegion: {},
    loadingTestsPathology: {},
    errorsPathologiesRegion: {},
    errorsTestsPathology: {},
  };

  return create<ClinicalTestsState>((set, get) => ({
    ...initial,

    async loadPathologiesForRegion(regionSlug, options) {
      const state = get();
      const cached = state.pathologiesByRegionSlug[regionSlug];
      if (cached && options?.reload !== true) {
        return cached;
      }
      if (state.loadingPathologiesRegion[regionSlug]) {
        // Un chargement est deja en vol : ne pas dedoubler. On attend que le
        // premier termine et on renvoie le cache resultant (ou [] si echec).
        // Implementation minimale : on renvoie les donnees actuelles ; un
        // appelant peut re-lire le store apres resolution.
        return cached ?? [];
      }

      set((s) => ({
        loadingPathologiesRegion: {
          ...s.loadingPathologiesRegion,
          [regionSlug]: true,
        },
        errorsPathologiesRegion: {
          ...s.errorsPathologiesRegion,
          [regionSlug]: null,
        },
      }));

      try {
        const pathologies = await repo.fetchPathologiesByRegion(regionSlug);
        set((s) => ({
          pathologiesByRegionSlug: {
            ...s.pathologiesByRegionSlug,
            [regionSlug]: pathologies,
          },
          loadingPathologiesRegion: {
            ...s.loadingPathologiesRegion,
            [regionSlug]: false,
          },
        }));
        return pathologies;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        set((s) => ({
          loadingPathologiesRegion: {
            ...s.loadingPathologiesRegion,
            [regionSlug]: false,
          },
          errorsPathologiesRegion: {
            ...s.errorsPathologiesRegion,
            [regionSlug]: message,
          },
        }));
        throw err;
      }
    },

    async loadTestsForPathology(pathologySlug, options) {
      const state = get();
      const cached = state.testsByPathologySlug[pathologySlug];
      if (cached && options?.reload !== true) {
        return cached;
      }
      if (state.loadingTestsPathology[pathologySlug]) {
        return cached ?? [];
      }

      set((s) => ({
        loadingTestsPathology: {
          ...s.loadingTestsPathology,
          [pathologySlug]: true,
        },
        errorsTestsPathology: {
          ...s.errorsTestsPathology,
          [pathologySlug]: null,
        },
      }));

      try {
        const tests = await repo.fetchClinicalTestsByPathology(pathologySlug);
        set((s) => ({
          testsByPathologySlug: {
            ...s.testsByPathologySlug,
            [pathologySlug]: tests,
          },
          loadingTestsPathology: {
            ...s.loadingTestsPathology,
            [pathologySlug]: false,
          },
        }));
        return tests;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        set((s) => ({
          loadingTestsPathology: {
            ...s.loadingTestsPathology,
            [pathologySlug]: false,
          },
          errorsTestsPathology: {
            ...s.errorsTestsPathology,
            [pathologySlug]: message,
          },
        }));
        throw err;
      }
    },

    reset: () => set({ ...initial }),
  }));
}

// L'instance par defaut (branchee sur le client Supabase de production) est
// exposee dans `@/store/defaults.ts` pour isoler les tests Vitest de la
// lecture des variables d'environnement VITE_SUPABASE_*.
