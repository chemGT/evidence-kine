// =============================================================================
// Evidence Kine - Page : Kitchen Sink (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Revue visuelle exhaustive de tous les composants UI du Sprint 4.
// Route : /kitchen-sink
// Accessible via le bouton "Composants UI" sur la page d'accueil.
// =============================================================================

import * as React from "react";
import { MedicalLayout } from "@/components/layout/MedicalLayout";
import { ProbabilityGauge } from "@/components/ui/ProbabilityGauge";
import {
  ClinicalTestCard,
  type TestResult,
} from "@/components/ui/ClinicalTestCard";
import { RedFlagBadge } from "@/components/ui/RedFlagBadge";
import { VignetteHeader } from "@/components/ui/VignetteHeader";

// ---------------------------------------------------------------------------
// Données de démo (fictives, aucune donnée réelle)
// ---------------------------------------------------------------------------

const DEMO_TESTS = [
  {
    id: "empty-can-jobe",
    nameFr: "Test d'Empty Can (Jobe)",
    procedureDescription:
      "Bras à 90° d'abduction dans le plan de la scapula, rotation médiale maximale (pouce vers le bas). Le praticien applique une pression vers le bas. Positif si faiblesse ou douleur.",
    sensitivity: 0.69,
    specificity: 0.62,
    lrPositive: 1.82,
    lrNegative: 0.5,
    evidenceLevel: "2a",
  },
  {
    id: "external-rotation-lag-sign",
    nameFr: "External Rotation Lag Sign",
    procedureDescription:
      "Coude à 90° de flexion, bras le long du corps. Le praticien amène passivement en rotation latérale maximale puis relâche. Positif si incapacité à maintenir la rotation latérale (lag > 5°).",
    sensitivity: 0.7,
    specificity: 0.97,
    lrPositive: 23.3,
    lrNegative: 0.31,
    evidenceLevel: "2b",
  },
  {
    id: "drop-arm",
    nameFr: "Test du Drop Arm",
    procedureDescription:
      "Le praticien élève passivement le bras du patient à 90° d'abduction puis demande une descente lente et contrôlée. Positif si chute brutale du bras ou incapacité à maintenir la position.",
    sensitivity: 0.21,
    specificity: 0.92,
    lrPositive: 2.63,
    lrNegative: 0.86,
    evidenceLevel: "2a",
  },
];

const DEMO_RED_FLAGS = [
  {
    id: "fracture-humerale",
    label: "Fracture humérale",
    description:
      "Douleur sévère, crépitations, déformation visible, impotence fonctionnelle totale après traumatisme",
    severity: "urgent" as const,
    present: false,
  },
  {
    id: "luxation-gleno",
    label: "Luxation gléno-humérale",
    description:
      "Déformation en épaulette, bras en abduction/rotation latérale, vacuité glénoïdienne palpable",
    severity: "urgent" as const,
    present: true,
  },
  {
    id: "douleur-nuit",
    label: "Douleur nocturne persistante",
    description: "Douleur réveillant la nuit, indépendante du mouvement",
    severity: "warning" as const,
    present: false,
  },
];

// ---------------------------------------------------------------------------
// Sections helper
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function KitchenSinkPage() {
  const [results, setResults] = React.useState<Record<string, TestResult>>({});

  function handleResult(id: string, result: TestResult) {
    setResults((prev) => ({ ...prev, [id]: result }));
  }

  return (
    <MedicalLayout backHref="/" backLabel="Accueil">
      <div className="flex flex-col gap-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Kitchen Sink
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revue visuelle des composants UI — Sprint 4
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* VignetteHeader                                                    */}
        {/* ---------------------------------------------------------------- */}
        <Section title="VignetteHeader">
          <VignetteHeader
            title="Homme 52 ans — douleur épaule droite post-chute vélo"
            age={52}
            sexe="homme"
            motifConsultation="Douleur épaule droite persistante depuis 3 semaines suite à une chute de vélo. Gêne importante lors des mouvements au-dessus de la tête."
            localisation="Épaule droite, face antéro-latérale, irradiant vers le moignon de l'épaule"
            cote="droit"
            debutSymptomes="Début brutal post-traumatique il y a 3 semaines"
            mecanisme="Chute de vélo, réception sur la main droite bras tendu"
            intensiteDouleur={6}
          />
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* ProbabilityGauge                                                  */}
        {/* ---------------------------------------------------------------- */}
        <Section title="ProbabilityGauge">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">Taille sm — 10 %</p>
              <ProbabilityGauge value={0.1} label="Probabilité" size="sm" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Taille md — pré-test 35 %
              </p>
              <ProbabilityGauge value={0.35} label="Pré-test" size="md" />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Taille md — post-test 68 % avec delta
              </p>
              <ProbabilityGauge
                value={0.68}
                previousValue={0.35}
                label="Post-test"
                size="md"
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Taille lg — 92 % avec delta
              </p>
              <ProbabilityGauge
                value={0.92}
                previousValue={0.68}
                label="Post-test"
                size="lg"
              />
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* ClinicalTestCard                                                  */}
        {/* ---------------------------------------------------------------- */}
        <Section title="ClinicalTestCard">
          <p className="text-xs text-muted-foreground">
            Cliquez sur un bouton pour enregistrer un résultat. L&apos;état est
            local à cette page.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {DEMO_TESTS.map((test) => (
              <ClinicalTestCard
                key={test.id}
                {...test}
                appliedResult={results[test.id] ?? null}
                onResult={(result) => handleResult(test.id, result)}
              />
            ))}
          </div>
          <div className="mt-2">
            <ClinicalTestCard
              id="demo-disabled"
              nameFr="Test désactivé (exemple)"
              procedureDescription="Ce test est désactivé pour la démonstration."
              sensitivity={0.5}
              specificity={0.8}
              lrPositive={2.5}
              lrNegative={0.62}
              disabled
              onResult={() => void 0}
            />
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* RedFlagBadge — version complète                                   */}
        {/* ---------------------------------------------------------------- */}
        <Section title="RedFlagBadge — Version complète">
          <div className="flex flex-col gap-3">
            {DEMO_RED_FLAGS.map((flag) => (
              <RedFlagBadge
                key={flag.id}
                label={flag.label}
                description={flag.description}
                severity={flag.severity}
                present={flag.present}
              />
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        {/* RedFlagBadge — version compacte                                   */}
        {/* ---------------------------------------------------------------- */}
        <Section title="RedFlagBadge — Version compacte (inline)">
          <div className="flex flex-wrap gap-2">
            {DEMO_RED_FLAGS.map((flag) => (
              <RedFlagBadge
                key={flag.id}
                label={flag.label}
                severity={flag.severity}
                present={flag.present}
                compact
              />
            ))}
          </div>
        </Section>
      </div>
    </MedicalLayout>
  );
}
