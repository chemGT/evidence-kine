// =============================================================================
// Evidence Kine - Composant : VignetteHeader (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Affiche le resume de la vignette clinique fictive : donnees patient fictives
// (age, sexe, cote), motif de consultation, mecanisme et intensite douloureuse.
//
// Ce composant est purement presentationnel. Les donnees proviennent du champ
// `vignette_data.anamnese` (valide par VignetteDataSchema, Sprint 3).
// =============================================================================

import { User, MapPin, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VignetteHeaderProps {
  title: string;
  age: number;
  sexe: "homme" | "femme";
  motifConsultation: string;
  localisation: string;
  cote?: "droit" | "gauche" | "bilateral";
  debutSymptomes?: string;
  mecanisme?: string;
  intensiteDouleur?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDemographics(
  age: number,
  sexe: "homme" | "femme",
  cote?: string,
): string {
  const gender = sexe === "homme" ? "Homme" : "Femme";
  const side = cote
    ? ` · ${cote === "droit" ? "Côté D" : cote === "gauche" ? "Côté G" : "Bilatéral"}`
    : "";
  return `${gender}, ${age}\u00a0ans${side}`;
}

function PainDots({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(10, Math.round(value)));
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`Douleur ${clamped}/10`}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block size-2 rounded-full",
            i < clamped ? "bg-foreground" : "bg-border",
          )}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1.5 font-technical text-xs font-semibold tabular-nums text-foreground">
        {clamped}/10
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function VignetteHeader({
  title,
  age,
  sexe,
  motifConsultation,
  localisation,
  cote,
  debutSymptomes,
  mecanisme,
  intensiteDouleur,
  className,
}: VignetteHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6",
        className,
      )}
    >
      {/* Titre */}
      <div>
        <span className="font-technical text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Vignette fictive
        </span>
        <h1 className="mt-1 text-xl font-semibold leading-snug text-foreground">
          {title}
        </h1>
      </div>

      {/* Grille info */}
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Démographie */}
        <div className="flex items-start gap-2">
          <User
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Patient fictif
            </dt>
            <dd className="text-sm font-medium text-foreground">
              {formatDemographics(age, sexe, cote)}
            </dd>
          </div>
        </div>

        {/* Localisation */}
        <div className="flex items-start gap-2">
          <MapPin
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Localisation
            </dt>
            <dd className="text-sm text-foreground">{localisation}</dd>
          </div>
        </div>

        {/* Début des symptômes */}
        {debutSymptomes && (
          <div className="flex items-start gap-2">
            <Clock
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Début
              </dt>
              <dd className="text-sm text-foreground">{debutSymptomes}</dd>
            </div>
          </div>
        )}

        {/* Intensité douleur */}
        {intensiteDouleur !== undefined && (
          <div className="flex items-start gap-2">
            <Zap
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Douleur
              </dt>
              <dd className="mt-0.5">
                <PainDots value={intensiteDouleur} />
              </dd>
            </div>
          </div>
        )}
      </dl>

      {/* Motif de consultation */}
      <div className="rounded-md bg-muted px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Motif de consultation
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          {motifConsultation}
        </p>
        {mecanisme && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium">Mécanisme : </span>
            {mecanisme}
          </p>
        )}
      </div>
    </header>
  );
}
