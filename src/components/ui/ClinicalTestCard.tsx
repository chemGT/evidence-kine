// =============================================================================
// Evidence Kine - Composant : ClinicalTestCard (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Affiche un test clinique orthopedique avec ses metriques clinimetriques
// (Se / Sp / LR+ / LR-) et deux boutons d'action : Positif / Negatif.
//
// Design Medical Excellence :
//   - Valeurs clinimetriques en IBM Plex Sans tabulaires.
//   - Cibles tactiles 44×44 px (tokens min-h-touch, min-w-touch).
//   - Bouton "Positif" → action blue ; "Negatif" → outline.
//   - Etat applied : remplace les boutons par un badge de resultat.
//   - procedure_description : masquee par defaut, expandable.
// =============================================================================

import * as React from "react";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TestResult = "positive" | "negative";

export interface ClinicalTestCardProps {
  /** Identifiant stable du test (UUID DB ou slug). */
  id: string;
  nameFr: string;
  procedureDescription: string;
  sensitivity: number;
  specificity: number;
  lrPositive: number | null;
  lrNegative: number | null;
  /** Niveau d'evidence Oxford CEBM (ex : "2a"). */
  evidenceLevel?: string | null;
  /** Resultat deja enregistre pour ce test. */
  appliedResult?: TestResult | null;
  /** Appele quand l'utilisateur choisit un resultat. */
  onResult: (result: TestResult) => void;
  /** Desactive les boutons (simulation terminee, test non disponible…). */
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers de formatage
// ---------------------------------------------------------------------------

function formatLR(value: number | null): string {
  if (value === null) return "\u2014";
  if (!isFinite(value)) return "\u221e";
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function formatProb(value: number): string {
  return `${Math.round(value * 100)}\u00a0%`;
}

// ---------------------------------------------------------------------------
// Sous-composant : grille des metriques
// ---------------------------------------------------------------------------

interface MetricsGridProps {
  sensitivity: number;
  specificity: number;
  lrPositive: number | null;
  lrNegative: number | null;
}

function MetricsGrid({
  sensitivity,
  specificity,
  lrPositive,
  lrNegative,
}: MetricsGridProps) {
  const metrics = [
    { label: "Se", value: formatProb(sensitivity), title: "Sensibilité" },
    { label: "Sp", value: formatProb(specificity), title: "Spécificité" },
    {
      label: "LR+",
      value: formatLR(lrPositive),
      title: "Rapport de vraisemblance positif",
    },
    {
      label: "LR\u2212",
      value: formatLR(lrNegative),
      title: "Rapport de vraisemblance négatif",
    },
  ] as const;

  return (
    <div
      className="grid grid-cols-4 divide-x divide-border rounded-md border border-border"
      role="table"
      aria-label="Métriques cliniques"
    >
      {metrics.map(({ label, value, title }) => (
        <div
          key={label}
          role="cell"
          title={title}
          className="flex flex-col items-center gap-0.5 px-2 py-2"
        >
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <span className="font-technical text-sm font-semibold tabular-nums text-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function ClinicalTestCard({
  id,
  nameFr,
  procedureDescription,
  sensitivity,
  specificity,
  lrPositive,
  lrNegative,
  evidenceLevel,
  appliedResult,
  onResult,
  disabled = false,
  className,
}: ClinicalTestCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isApplied = appliedResult != null;
  const descId = `desc-${id}`;

  return (
    <Card
      className={cn(
        "transition-shadow duration-medical",
        isApplied && appliedResult === "positive" && "border-action/40",
        isApplied &&
          appliedResult === "negative" &&
          "border-muted-foreground/30",
        className,
      )}
    >
      <CardHeader className="pb-3">
        {/* Titre + badge evidence */}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{nameFr}</CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            {evidenceLevel && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-technical text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {evidenceLevel}
              </span>
            )}
            {/* Toggle description */}
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={descId}
              onClick={() => setExpanded((v) => !v)}
              className="flex min-h-touch min-w-touch items-center justify-center rounded text-muted-foreground transition-colors duration-medical hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={expanded ? "Masquer la procédure" : "Voir la procédure"}
            >
              {expanded ? (
                <ChevronUp className="size-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Description de la procédure (expandable) */}
        {expanded && (
          <p
            id={descId}
            className="mt-2 text-sm leading-relaxed text-muted-foreground"
          >
            {procedureDescription}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {/* Grille métriques */}
        <MetricsGrid
          sensitivity={sensitivity}
          specificity={specificity}
          lrPositive={lrPositive}
          lrNegative={lrNegative}
        />

        {/* Actions / résultat */}
        {isApplied ? (
          <div
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium",
              appliedResult === "positive"
                ? "border-action/30 bg-action/5 text-action"
                : "border-border bg-muted/50 text-muted-foreground",
            )}
            aria-live="polite"
          >
            {appliedResult === "positive" ? (
              <>
                <Check className="size-4" aria-hidden="true" />
                Résultat positif enregistré
              </>
            ) : (
              <>
                <X className="size-4" aria-hidden="true" />
                Résultat négatif enregistré
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              size="default"
              disabled={disabled}
              onClick={() => onResult("positive")}
              aria-label={`${nameFr} — résultat positif`}
            >
              + Positif
            </Button>
            <Button
              variant="outline"
              size="default"
              disabled={disabled}
              onClick={() => onResult("negative")}
              aria-label={`${nameFr} — résultat négatif`}
            >
              − Négatif
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
