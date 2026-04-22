-- =============================================================================
-- Evidence Kine - Seed : Tests orthopediques de l'epaule
-- -----------------------------------------------------------------------------
-- Serious Game pedagogique uniquement. Aucune donnee de patient reel.
-- Sources principales :
--   - Hegedus EJ et al. Br J Sports Med. 2012;46(14):964-978.
--     DOI: 10.1136/bjsports-2012-091066
--   - Lo IK et al. Am J Sports Med. 2004;32(2):301-7.
--     DOI: 10.1177/0363546503258869
--   - Hertel R et al. J Shoulder Elbow Surg. 1996;5(4):307-13.
--     DOI: 10.1016/S1058-2746(96)80058-9
--   - Kim SH et al. Arthroscopy. 2001;17(2):160-4.
--     DOI: 10.1053/jars.2001.22404
-- Niveaux d'evidence : echelle Oxford CEBM (1a/1b/2a/2b/...).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Regions anatomiques
-- -----------------------------------------------------------------------------
insert into public.body_regions (slug, label_fr, label_en)
values
  ('shoulder', 'Epaule', 'Shoulder'),
  ('ankle',    'Cheville', 'Ankle')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Pathologies de l'epaule
-- -----------------------------------------------------------------------------
insert into public.pathologies (body_region_id, slug, label_fr, label_en, icd10_code, description)
select
  br.id,
  p.slug,
  p.label_fr,
  p.label_en,
  p.icd10_code,
  p.description
from public.body_regions br
cross join (values
  (
    'shoulder-rotator-cuff-tear',
    'Rupture de la coiffe des rotateurs',
    'Rotator cuff tear',
    'M75.1',
    'Rupture complete ou partielle d''un ou plusieurs tendons de la coiffe (sus-epineux, sous-epineux, petit rond, sous-scapulaire).'
  ),
  (
    'shoulder-subacromial-impingement',
    'Conflit sous-acromial',
    'Subacromial impingement syndrome',
    'M75.4',
    'Syndrome d''accrochage de la coiffe sous l''arche coraco-acromiale, souvent associe a une tendinopathie.'
  ),
  (
    'shoulder-anterior-instability',
    'Instabilite anterieure de l''epaule',
    'Anterior shoulder instability',
    'M25.31',
    'Laxite et/ou luxation recidivante anterieure gleno-humerale.'
  ),
  (
    'shoulder-slap-lesion',
    'Lesion SLAP',
    'SLAP lesion (superior labrum anterior to posterior)',
    'S43.43',
    'Lesion du bourrelet glenoidien superieur, d''avant en arriere, souvent associee a l''ancrage du biceps.'
  ),
  (
    'shoulder-biceps-tendinopathy',
    'Tendinopathie du long biceps',
    'Long head of biceps tendinopathy',
    'M75.2',
    'Atteinte inflammatoire ou degenerative du tendon du long chef du biceps brachial.'
  ),
  (
    'shoulder-ac-joint-pathology',
    'Pathologie de l''articulation acromio-claviculaire',
    'Acromioclavicular joint pathology',
    'M19.019',
    'Arthrose, entorse ou disjonction de l''articulation acromio-claviculaire.'
  )
) as p (slug, label_fr, label_en, icd10_code, description)
where br.slug = 'shoulder'
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Clinical tests : Coiffe des rotateurs & conflit sous-acromial
-- -----------------------------------------------------------------------------

-- Hawkins-Kennedy (conflit sous-acromial)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'hawkins-kennedy-impingement',
  'Test de Hawkins-Kennedy',
  'Hawkins-Kennedy test',
  'Bras en elevation anterieure a 90 degres, coude flechi a 90 degres, le praticien imprime une rotation mediale passive. Positif si reproduction de la douleur anterolaterale.',
  0.74, 0.57, 1.72, 0.46,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-subacromial-impingement'
on conflict (slug) do nothing;

-- Neer (conflit sous-acromial)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'neer-impingement',
  'Test de Neer',
  'Neer impingement sign',
  'Praticien stabilise la scapula, eleve passivement le bras dans le plan de la scapula en rotation mediale. Positif si douleur anterolaterale en fin d''elevation.',
  0.72, 0.60, 1.80, 0.47,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-subacromial-impingement'
on conflict (slug) do nothing;

-- Empty Can / Jobe (rupture coiffe - sus-epineux)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'empty-can-jobe',
  'Test d''Empty Can (Jobe)',
  'Empty Can test (Jobe)',
  'Bras a 90 degres d''abduction dans le plan de la scapula, rotation mediale maximale (pouce vers le bas). Le praticien applique une pression vers le bas. Positif si faiblesse ou douleur.',
  0.69, 0.62, 1.82, 0.50,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-rotator-cuff-tear'
on conflict (slug) do nothing;

-- Full Can (rupture coiffe - sus-epineux)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'full-can',
  'Test de Full Can',
  'Full Can test',
  'Bras a 90 degres d''abduction dans le plan de la scapula, rotation laterale (pouce vers le haut). Pression vers le bas. Positif si faiblesse ou douleur.',
  0.70, 0.81, 3.68, 0.37,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-rotator-cuff-tear'
on conflict (slug) do nothing;

-- Drop Arm (rupture coiffe)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'drop-arm',
  'Test du Drop Arm',
  'Drop Arm test',
  'Le praticien eleve passivement le bras du patient a 90 degres d''abduction puis demande une descente lente et controlee. Positif si chute brutale du bras ou incapacite a maintenir la position.',
  0.21, 0.92, 2.63, 0.86,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-rotator-cuff-tear'
on conflict (slug) do nothing;

-- External Rotation Lag Sign (rupture coiffe posterieure)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'external-rotation-lag-sign',
  'External Rotation Lag Sign',
  'External Rotation Lag Sign',
  'Coude a 90 degres de flexion, bras le long du corps. Le praticien amene passivement en rotation laterale maximale puis relache. Positif si incapacite a maintenir la rotation laterale (lag > 5 degres).',
  0.70, 0.97, 23.30, 0.31,
  '2b',
  '10.1016/S1058-2746(96)80058-9',
  'Hertel R et al., J Shoulder Elbow Surg 1996'
from public.pathologies p where p.slug = 'shoulder-rotator-cuff-tear'
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Clinical tests : Instabilite anterieure
-- -----------------------------------------------------------------------------

-- Apprehension
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'apprehension',
  'Test d''Apprehension',
  'Apprehension test',
  'Patient en decubitus dorsal, bras a 90 degres d''abduction et 90 degres de flexion de coude. Le praticien imprime une rotation laterale progressive. Positif si sensation d''apprehension (et non simple douleur).',
  0.72, 0.96, 20.20, 0.29,
  '1b',
  '10.1177/0363546503258869',
  'Lo IK et al., Am J Sports Med 2004'
from public.pathologies p where p.slug = 'shoulder-anterior-instability'
on conflict (slug) do nothing;

-- Relocation
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'relocation',
  'Test de Relocation (Jobe)',
  'Relocation test (Jobe)',
  'Apres un test d''apprehension positif, le praticien applique une pression posterieure sur la tete humerale. Positif si disparition de l''apprehension.',
  0.81, 0.92, 10.40, 0.21,
  '1b',
  '10.1177/0363546503258869',
  'Lo IK et al., Am J Sports Med 2004'
from public.pathologies p where p.slug = 'shoulder-anterior-instability'
on conflict (slug) do nothing;

-- Surprise / Release (instabilite)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'surprise-release',
  'Test de Surprise (Release)',
  'Surprise (Release) test',
  'Dans la position du test de relocation, le praticien relache brusquement la pression posterieure. Positif si reapparition soudaine de l''apprehension ou subluxation anterieure.',
  0.64, 0.99, 58.60, 0.36,
  '1b',
  '10.1177/0363546503258869',
  'Lo IK et al., Am J Sports Med 2004'
from public.pathologies p where p.slug = 'shoulder-anterior-instability'
on conflict (slug) do nothing;

-- Sulcus Sign (instabilite inferieure)
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'sulcus-sign',
  'Signe du Sulcus',
  'Sulcus Sign',
  'Patient assis, bras le long du corps. Le praticien exerce une traction axiale vers le bas. Positif si apparition d''un sillon sous-acromial > 1 cm, traduisant une laxite inferieure.',
  0.28, 0.97, 9.33, 0.74,
  '2b',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-anterior-instability'
on conflict (slug) do nothing;

-- Load and Shift
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'load-and-shift',
  'Test de Load and Shift',
  'Load and Shift test',
  'Patient assis ou couche, le praticien empaume la tete humerale et applique une charge axiale dans la glene, puis une translation anterieure puis posterieure. Graduation 0 a 3 de la translation.',
  0.50, 0.89, 4.55, 0.56,
  '2b',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-anterior-instability'
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Clinical tests : Lesion SLAP & tendinopathie du biceps
-- -----------------------------------------------------------------------------

-- O'Brien Active Compression
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'obrien-active-compression',
  'Test de O''Brien (Active Compression)',
  'O''Brien Active Compression test',
  'Bras a 90 degres d''anteposition, 10 degres d''adduction horizontale, rotation mediale (pouce vers le bas). Pression vers le bas resistee. Puis meme test en rotation laterale (paume vers le haut). Positif si douleur profonde en rotation mediale, disparaissant en rotation laterale.',
  0.67, 0.37, 1.06, 0.89,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-slap-lesion'
on conflict (slug) do nothing;

-- Speed
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'speed-test',
  'Test de Speed',
  'Speed test',
  'Bras en flexion de 90 degres, coude en extension, avant-bras en supination. Le praticien resiste a la flexion. Positif si douleur anterieure sur le trajet du long biceps.',
  0.32, 0.75, 1.28, 0.91,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-biceps-tendinopathy'
on conflict (slug) do nothing;

-- Yergason
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'yergason',
  'Test de Yergason',
  'Yergason test',
  'Coude flechi a 90 degres, avant-bras en pronation. Le praticien resiste simultanement a la supination et a la rotation laterale de l''epaule. Positif si douleur dans la gouttiere bicipitale.',
  0.41, 0.79, 1.95, 0.75,
  '2a',
  '10.1136/bjsports-2012-091066',
  'Hegedus EJ et al., BJSM 2012 (meta-analysis)'
from public.pathologies p where p.slug = 'shoulder-biceps-tendinopathy'
on conflict (slug) do nothing;

-- Biceps Load II
insert into public.clinical_tests
  (pathology_id, slug, name_fr, name_en, procedure_description,
   sensitivity, specificity, lr_positive, lr_negative,
   evidence_level, source_doi, source_reference)
select p.id,
  'biceps-load-ii',
  'Test de Biceps Load II',
  'Biceps Load II test',
  'Patient en decubitus dorsal, bras a 120 degres d''abduction, rotation laterale maximale, coude a 90 degres, avant-bras en supination. Le praticien resiste a la flexion du coude. Positif si douleur.',
  0.90, 0.97, 29.40, 0.10,
  '2b',
  '10.1053/jars.2001.22404',
  'Kim SH et al., Arthroscopy 2001'
from public.pathologies p where p.slug = 'shoulder-slap-lesion'
on conflict (slug) do nothing;
