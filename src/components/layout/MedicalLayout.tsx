// =============================================================================
// Evidence Kine - Composant : MedicalLayout (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Shell de mise en page pour toutes les pages du simulateur.
//
// Responsabilites :
//   - Conteneur max-width centre (max-w-3xl).
//   - Navigation superieure : nom de l'appli + lien retour optionnel.
//   - Slot principal : children.
//   - Footer : disclaimer legal permanent (AGENTS.md : non negociable).
//
// Cibles tactiles : min-h-touch (44 px) sur tous les elements interactifs.
// Fond : blanc pur (#FFFFFF, --background).
// =============================================================================

import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MedicalLayoutProps {
  children: ReactNode;
  /** Lien retour affiché dans la barre de navigation (optionnel). */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function MedicalLayout({
  children,
  backHref,
  backLabel = "Retour",
  className,
}: MedicalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                          */}
      {/* ------------------------------------------------------------------ */}
      <nav
        className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm"
        aria-label="Navigation principale"
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          {/* Lien retour ou titre */}
          {backHref ? (
            <Link
              to={backHref}
              className="flex min-h-touch min-w-touch items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-medical hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={backLabel}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              {backLabel}
            </Link>
          ) : (
            <Link
              to="/"
              className="flex min-h-touch items-center text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Evidence Kiné
            </Link>
          )}

          {/* Indicateur alpha */}
          <span className="font-technical text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Alpha
          </span>
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Contenu principal                                                   */}
      {/* ------------------------------------------------------------------ */}
      <main className={cn("mx-auto max-w-3xl px-6 py-8", className)}>
        {children}
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Footer — disclaimer legal PERMANENT (AGENTS.md)                    */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Serious Game pédagogique uniquement.{" "}
            <strong className="font-medium text-foreground">
              Aucune donnée de patient réel.
            </strong>{" "}
            Ce simulateur ne constitue pas un avis médical et ne remplace pas
            l&apos;évaluation clinique d&apos;un professionnel de santé.
          </p>
        </div>
      </footer>
    </div>
  );
}
