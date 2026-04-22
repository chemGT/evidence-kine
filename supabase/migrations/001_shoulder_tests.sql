-- =============================================================================
-- Evidence Kine - Migration 001 : Tests orthopediques de l'epaule
-- -----------------------------------------------------------------------------
-- Serious Game pedagogique uniquement. Aucune donnee de patient reel.
-- Architecture : body_regions -> pathologies -> clinical_tests / clinical_cases
-- Conventions : snake_case, RLS active par defaut, lecture publique anonyme.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table : body_regions
-- -----------------------------------------------------------------------------
create table if not exists public.body_regions (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label_fr    text not null,
  label_en    text,
  created_at  timestamptz not null default now()
);

create index if not exists body_regions_slug_idx
  on public.body_regions (slug);

-- -----------------------------------------------------------------------------
-- Table : pathologies
-- -----------------------------------------------------------------------------
create table if not exists public.pathologies (
  id              uuid primary key default gen_random_uuid(),
  body_region_id  uuid not null references public.body_regions(id) on delete restrict,
  slug            text not null unique,
  label_fr        text not null,
  label_en        text,
  icd10_code      text,
  description     text,
  created_at      timestamptz not null default now()
);

create index if not exists pathologies_body_region_idx
  on public.pathologies (body_region_id);

create index if not exists pathologies_slug_idx
  on public.pathologies (slug);

-- -----------------------------------------------------------------------------
-- Table : clinical_tests
-- -----------------------------------------------------------------------------
-- Stocke la clinimetrie (Se, Sp, LR+, LR-) d'un test orthopedique.
-- Les contraintes garantissent que les valeurs restent physiquement plausibles.
-- -----------------------------------------------------------------------------
create table if not exists public.clinical_tests (
  id                     uuid primary key default gen_random_uuid(),
  pathology_id           uuid not null references public.pathologies(id) on delete cascade,
  slug                   text not null unique,
  name_fr                text not null,
  name_en                text,
  procedure_description  text not null,
  sensitivity            numeric(4,3) not null,
  specificity            numeric(4,3) not null,
  lr_positive            numeric(6,2),
  lr_negative            numeric(6,3),
  evidence_level         text,
  source_doi             text,
  source_reference       text,
  created_at             timestamptz not null default now(),

  constraint clinical_tests_sensitivity_range
    check (sensitivity >= 0 and sensitivity <= 1),
  constraint clinical_tests_specificity_range
    check (specificity >= 0 and specificity <= 1),
  constraint clinical_tests_lr_positive_range
    check (lr_positive is null or lr_positive >= 0),
  constraint clinical_tests_lr_negative_range
    check (lr_negative is null or lr_negative >= 0)
);

create index if not exists clinical_tests_pathology_idx
  on public.clinical_tests (pathology_id);

create index if not exists clinical_tests_slug_idx
  on public.clinical_tests (slug);

-- -----------------------------------------------------------------------------
-- Table : clinical_cases
-- -----------------------------------------------------------------------------
-- Vignettes cliniques fictives utilisees dans le Serious Game.
-- vignette_data (jsonb) : { anamnese, examen_physique, red_flags, ... }
-- -----------------------------------------------------------------------------
create table if not exists public.clinical_cases (
  id             uuid primary key default gen_random_uuid(),
  pathology_id   uuid not null references public.pathologies(id) on delete cascade,
  slug           text not null unique,
  title          text not null,
  vignette_data  jsonb not null default '{}'::jsonb,
  is_published   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists clinical_cases_pathology_idx
  on public.clinical_cases (pathology_id);

create index if not exists clinical_cases_published_idx
  on public.clinical_cases (is_published) where is_published = true;

-- =============================================================================
-- Row Level Security
-- -----------------------------------------------------------------------------
-- Les donnees de reference (regions, pathologies, tests) sont publiques en
-- lecture pour tous les utilisateurs authentifies ou anonymes du Serious Game.
-- L'ecriture est reservee au service role (ingestion scientifique).
-- =============================================================================

alter table public.body_regions    enable row level security;
alter table public.pathologies     enable row level security;
alter table public.clinical_tests  enable row level security;
alter table public.clinical_cases  enable row level security;

-- body_regions : lecture publique
drop policy if exists body_regions_public_read on public.body_regions;
create policy body_regions_public_read
  on public.body_regions
  for select
  to anon, authenticated
  using (true);

-- pathologies : lecture publique
drop policy if exists pathologies_public_read on public.pathologies;
create policy pathologies_public_read
  on public.pathologies
  for select
  to anon, authenticated
  using (true);

-- clinical_tests : lecture publique
drop policy if exists clinical_tests_public_read on public.clinical_tests;
create policy clinical_tests_public_read
  on public.clinical_tests
  for select
  to anon, authenticated
  using (true);

-- clinical_cases : seuls les cas publies sont visibles aux utilisateurs
drop policy if exists clinical_cases_public_read on public.clinical_cases;
create policy clinical_cases_public_read
  on public.clinical_cases
  for select
  to anon, authenticated
  using (is_published = true);
