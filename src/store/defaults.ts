// =============================================================================
// Evidence Kine - Instances par defaut des stores (wiring prod)
// -----------------------------------------------------------------------------
// Ce fichier instancie les hooks Zustand de production a partir du client
// Supabase partage (`@/lib/supabase`). Importer ce module declenche la
// lecture des variables d'environnement VITE_SUPABASE_*, ce qui est
// VOLONTAIREMENT evite dans les tests : tout test Vitest utilise les
// factories `createClinicalTestsStore(repo)` avec un repo mock.
// =============================================================================

import { createClinicalTestsRepository } from "@/data/repositories/clinicalTestsRepo";
import { supabase } from "@/lib/supabase";
import { createClinicalTestsStore } from "@/store/clinicalTestsStore";

export const useClinicalTestsStore = createClinicalTestsStore(
  createClinicalTestsRepository(supabase),
);

export { useSimulationStore } from "@/store/simulationStore";
