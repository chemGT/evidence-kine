-- =============================================================================
-- Evidence Kine - Seed : Vignettes cliniques fictives de l'epaule (Sprint 3)
-- -----------------------------------------------------------------------------
-- Serious Game pedagogique uniquement. AUCUNE DONNEE DE PATIENT REEL.
-- Tout cas ici est integralement fictif et ne constitue pas un avis medical.
--
-- Vignette : Homme 52 ans, douleur epaule droite post-chute velo, faiblesse
--            elevation.
-- Pathologie cible : Rupture de la coiffe des rotateurs (sus-epineux)
-- Probabilite pre-test : 0.35 (base epidemiologique : age + mecanisme +
--   faiblesse en abduction. Source : Yamamoto et al., Acta Orthop 2010)
--
-- Red flags codes (present: false pour ce cas) :
--   1. fracture-humerale       — fracture de la grosse tuberosite possible
--   2. luxation-gleno-humerale — luxation post-traumatique
--   3. atteinte-neuro          — lesion nerf axillaire / plexus brachial
--
-- Tests suggeres (4) lies a la pathologie shoulder-rotator-cuff-tear :
--   empty-can-jobe             Se=0.69 Sp=0.62 LR+=1.82 LR-=0.50
--   full-can                   Se=0.70 Sp=0.81 LR+=3.68 LR-=0.37
--   drop-arm                   Se=0.21 Sp=0.92 LR+=2.63 LR-=0.86
--   external-rotation-lag-sign Se=0.70 Sp=0.97 LR+=23.30 LR-=0.31
-- =============================================================================

insert into public.clinical_cases
  (pathology_id, slug, title, vignette_data, is_published)
select
  p.id,
  'shoulder-rotator-cuff-52yo-cyclist',
  'Homme 52 ans — douleur epaule droite post-chute velo',
  $vignette_json${
    "disclaimer": "Vignette fictive — Serious Game pedagogique uniquement. Aucune donnee de patient reel.",
    "anamnese": {
      "age": 52,
      "sexe": "homme",
      "motifConsultation": "Douleur epaule droite persistante depuis 3 semaines suite a une chute de velo. Gêne importante lors des mouvements au-dessus de la tete.",
      "localisation": "Epaule droite, face antero-laterale, irradiant vers le moignon de l'epaule",
      "cote": "droit",
      "debutSymptomes": "Debut brutal post-traumatique il y a 3 semaines, persistance malgre la mise au repos",
      "mecanisme": "Chute de velo a vitesse moderee, reception sur la main droite bras tendu, epaule en abduction forcee",
      "intensiteDouleur": 6,
      "antecedents": [
        "Pas d'antecedent chirurgical connu",
        "Sportif amateur actif (cyclisme 3 seances par semaine)",
        "Douleurs epaule droite intermittentes les 6 derniers mois (pre-existantes, non investiguees)"
      ]
    },
    "examen": {
      "inspection": "Legere amyotrophie du relief deltoidien droit. Pas de deformation visible ni de signe d'epaulette. Attitude antalgique : bras le long du corps, avant-bras en rotation mediale.",
      "amplitudesActives": {
        "elevation_anterieure": "90 degres (arret douloureux)",
        "abduction": "80 degres (arret douloureux, arc douloureux 60-120)",
        "rotation_laterale": "40 degres",
        "rotation_mediale": "Niveau L3"
      },
      "amplitudesPassives": {
        "elevation_anterieure": "150 degres (douleur en fin de course)",
        "abduction": "160 degres (douleur a partir de 100 degres)"
      },
      "bilan": "Faiblesse notable en abduction et elevation (cote 3/5 Medical Research Council). Douleur a la palpation profonde du tendon du sus-epineux au niveau de son insertion sur la grosse tuberosite. Pas de deficit sensitif distal. Pas d'instabilite evidente a la palpation de la tete humerale."
    },
    "redFlags": [
      {
        "id": "fracture-humerale",
        "label": "Fracture humerale",
        "description": "Douleur severe, crepitations, deformation visible, impotence fonctionnelle totale apres traumatisme",
        "severity": "urgent",
        "present": false
      },
      {
        "id": "luxation-gleno-humerale",
        "label": "Luxation gleno-humerale",
        "description": "Deformation en epaulette, bras en abduction/rotation laterale, vacuite glenoidienne palpable",
        "severity": "urgent",
        "present": false
      },
      {
        "id": "atteinte-neuro",
        "label": "Atteinte neurologique",
        "description": "Deficit sensitif ou moteur (nerf axillaire : anesthesie moignon de l'epaule, paralysie deltoide)",
        "severity": "urgent",
        "present": false
      }
    ],
    "preTestProbability": 0.35,
    "suggestedTests": [
      {
        "testSlug": "empty-can-jobe",
        "rationale": "Evalue l'integrite du sus-epineux. Se=0.69, Sp=0.62, LR+=1.82. Premier test de debrouillage."
      },
      {
        "testSlug": "full-can",
        "rationale": "Alternative au Empty Can avec meilleure specificite. Se=0.70, Sp=0.81, LR+=3.68."
      },
      {
        "testSlug": "drop-arm",
        "rationale": "Haute specificite pour rupture transfixiante. Se=0.21, Sp=0.92, LR+=2.63. Tres informatif si positif."
      },
      {
        "testSlug": "external-rotation-lag-sign",
        "rationale": "Specificite tres elevee pour rupture coiffe posterieure. Se=0.70, Sp=0.97, LR+=23.30."
      }
    ]
  }$vignette_json$::jsonb,
  true
from public.pathologies p
where p.slug = 'shoulder-rotator-cuff-tear'
on conflict (slug) do nothing;
