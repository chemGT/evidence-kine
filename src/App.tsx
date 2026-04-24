// =============================================================================
// Evidence Kine - Routeur principal (Sprint 4)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
// =============================================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("@/pages/HomePage"));
const KitchenSinkPage = lazy(() => import("@/pages/KitchenSinkPage"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span className="font-technical text-xs uppercase tracking-widest text-muted-foreground">
        Chargement…
      </span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kitchen-sink" element={<KitchenSinkPage />} />
          {/* Sprint 5 : route simulateur */}
          <Route path="/simulator/*" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
