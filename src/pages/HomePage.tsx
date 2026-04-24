// =============================================================================
// Evidence Kine - Page : Accueil (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
// =============================================================================

import { Link } from "react-router-dom";
import { MedicalLayout } from "@/components/layout/MedicalLayout";

export default function HomePage() {
  return (
    <MedicalLayout>
      <div className="flex flex-col justify-center py-12">
        <span className="font-technical text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Evidence Kiné · Alpha
        </span>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          Serious Game clinique bayésien
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Plateforme pédagogique pour l&apos;Accès Direct en kinésithérapie.
          Raisonnement clinique par ratios de vraisemblance, vignettes fictives,
          triage et détection des red flags.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/simulator/shoulder/shoulder-rotator-cuff-52yo-cyclist"
            className="inline-flex h-11 min-w-touch items-center justify-center rounded-md bg-action px-5 text-sm font-medium text-action-foreground transition-colors duration-medical hover:bg-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Démarrer une vignette
          </Link>
          <Link
            to="/kitchen-sink"
            className="inline-flex h-11 min-w-touch items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground transition-colors duration-medical hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Composants UI
          </Link>
        </div>
      </div>
    </MedicalLayout>
  );
}
