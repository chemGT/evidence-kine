// =============================================================================
// Evidence Kine - Composant : ProbabilityGauge (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Affiche la probabilite courante (pre-test ou post-test) sous forme d'une
// barre horizontale animee + valeur numerique proeminente.
//
// Design Medical Excellence :
//   - Valeur en IBM Plex Sans avec chiffres tabulaires.
//   - Barre animee en 160 ms ease-out (token duration-medical).
//   - Couleur action (#007AFF) — jamais de redflag ici.
//   - Accessibilite : role="meter" + aria-valuenow/min/max/label.
// =============================================================================

import { cn } from "@/lib/utils";

export interface ProbabilityGaugeProps {
  /** Probabilite courante dans [0, 1]. */
  value: number;
  /** Probabilite precedente (optionnelle) — affiche le delta. */
  previousValue?: number;
  /** Label au-dessus de la jauge (ex : "Probabilité post-test"). */
  label?: string;
  /** Taille de l'affichage numerique. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function formatPct(v: number): string {
  return `${Math.round(clamp(v) * 100)}\u00a0%`;
}

function formatDelta(current: number, previous: number): string {
  const diff = Math.round((clamp(current) - clamp(previous)) * 100);
  if (diff === 0) return "\u00b10\u00a0%";
  return diff > 0 ? `+${diff}\u00a0%` : `${diff}\u00a0%`;
}

const valueSizeClasses: Record<
  NonNullable<ProbabilityGaugeProps["size"]>,
  string
> = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-5xl",
};

const trackHeightClasses: Record<
  NonNullable<ProbabilityGaugeProps["size"]>,
  string
> = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-2.5",
};

export function ProbabilityGauge({
  value,
  previousValue,
  label,
  size = "md",
  className,
}: ProbabilityGaugeProps) {
  const clamped = clamp(value);
  const pct = Math.round(clamped * 100);
  const hasDelta =
    previousValue !== undefined && Math.abs(value - previousValue) > 0.001;
  const deltaPositive = hasDelta && value > (previousValue ?? 0);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header : label + valeur */}
      <div className="flex items-baseline justify-between gap-4">
        {label && (
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </span>
        )}
        <span
          className={cn(
            "font-technical font-semibold leading-none text-foreground tabular-nums",
            valueSizeClasses[size],
          )}
          aria-hidden="true"
        >
          {formatPct(clamped)}
        </span>
      </div>

      {/* Barre de progression */}
      <div
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label} : ${pct} %` : `Probabilité : ${pct} %`}
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          trackHeightClasses[size],
        )}
      >
        <div
          className="h-full rounded-full bg-action"
          style={{
            width: `${pct}%`,
            transition: "width 160ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      {/* Delta (optionnel) */}
      {hasDelta && (
        <p className="font-technical text-xs tabular-nums text-muted-foreground">
          {previousValue !== undefined && (
            <>
              <span>{formatPct(previousValue)}</span>
              <span className="mx-1 text-border">→</span>
            </>
          )}
          <span
            className={cn(
              "font-medium",
              deltaPositive ? "text-action" : "text-muted-foreground",
            )}
          >
            {formatDelta(value, previousValue ?? 0)}
          </span>
        </p>
      )}
    </div>
  );
}
