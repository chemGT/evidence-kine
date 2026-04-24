-- =============================================================================
-- Evidence Kine - Migration 002 : Extensions clinical_cases
-- -----------------------------------------------------------------------------
-- Serious Game pedagogique uniquement. Aucune donnee de patient reel.
--
-- Analyse Sprint 3 : la table `clinical_cases` existante dispose deja de
-- `vignette_data jsonb not null default '{}'::jsonb`, ce qui est suffisant
-- pour stocker le schema complet (anamnese, examen, redFlags[], etc.).
--
-- Cette migration ajoute :
--   1. Un index GIN sur vignette_data pour accelrer les recherches jsonb
--      futures (Sprint 5 : filtre par pre_test_probability ou red_flags).
--   2. Un index sur (pathology_id, is_published) pour les requetes de
--      chargement vignette par pathologie (Sprint 5 : route /simulator).
--   3. Contrainte CHECK : vignette_data doit contenir la cle 'disclaimer'
--      (garde-fou legal minimum au niveau DB).
--
-- Pas de nouveau champ colonne : le jsonb est suffisant pour Phase 1 Alpha.
-- =============================================================================

-- Index GIN pour recherches jsonb (pre_test_probability, red_flags, etc.)
create index if not exists clinical_cases_vignette_gin_idx
  on public.clinical_cases using gin (vignette_data);

-- Index composite pour chargement par pathologie publiee (Sprint 5)
create index if not exists clinical_cases_pathology_published_idx
  on public.clinical_cases (pathology_id, is_published)
  where is_published = true;

-- Contrainte legale : le disclaimer doit etre present dans vignette_data
-- (evite d'inserer un cas sans mention fictive par inadvertance).
alter table public.clinical_cases
  drop constraint if exists clinical_cases_disclaimer_required;

alter table public.clinical_cases
  add constraint clinical_cases_disclaimer_required
  check (
    vignette_data = '{}'::jsonb
    or vignette_data ? 'disclaimer'
  );
