// =============================================================================
// Evidence Kine - Composant : RedFlagBadge (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Affiche un red flag clinique.
//
// Regles STYLE.md (NON NEGOCIABLES) :
//   - La couleur #FF3B30 (redflag) est EXCLUSIVEMENT reservee a ce composant.
//   - Jamais utiliser la couleur redflag pour autre chose que les red flags.
//   - present=true : fond/bordure rouge, aria-role="alert" pour screen readers.
//   - present=false : affichage discret en muted — le flag existe mais est absent.
// =============================================================================

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RedFlagBadgeProps {
  label: string;
  description?: string;
  severity: "urgent" | "warning";
  /** true = ce red flag est present chez le patient fictif. */
  present: boolean;
  /** Affiche le composant en version compacte (badge inline). */
  compact?: boolean;
  className?: string;
}

export function RedFlagBadge({
  label,
  description,
  severity,
  present,
  compact = false,
  className,
}: RedFlagBadgeProps) {
  const Icon = severity === "urgent" ? ShieldAlert : AlertTriangle;

  if (compact) {
    return (
      <span
        role={present ? "alert" : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-medical",
          present
            ? "border-redflag/30 bg-redflag/10 text-redflag"
            : "border-border bg-muted text-muted-foreground",
          className,
        )}
      >
        <Icon
          className={cn(
            "size-3",
            present ? "text-redflag" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        {label}
      </span>
    );
  }

  return (
    <div
      role={present ? "alert" : undefined}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 transition-colors duration-medical",
        present
          ? "border-redflag/40 bg-redflag/5"
          : "border-border bg-background",
        className,
      )}
    >
      {/* Icône */}
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          present ? "bg-redflag/10" : "bg-muted",
        )}
      >
        <Icon
          className={cn(
            "size-4",
            present ? "text-redflag" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
      </div>

      {/* Texte */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold leading-snug",
            present ? "text-redflag" : "text-foreground",
          )}
        >
          {label}
        </p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Badge statut */}
      {present && (
        <span className="shrink-0 rounded bg-redflag px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-redflag-foreground">
          {severity === "urgent" ? "URGENT" : "ALERTE"}
        </span>
      )}
    </div>
  );
}
