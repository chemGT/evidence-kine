export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
      <span className="font-technical text-xs uppercase tracking-[0.2em] text-slate-500">
        Evidence Kiné · Alpha
      </span>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        Serious Game clinique bayésien
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
        Plateforme pédagogique pour l&apos;Accès Direct en kinésithérapie.
        Raisonnement clinique par ratios de vraisemblance, vignettes fictives,
        triage et détection des red flags.
      </p>

      <div className="mt-10 flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-md bg-action px-5 text-sm font-medium text-white transition-colors duration-medical ease-medical hover:bg-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
        >
          Démarrer une vignette
        </button>
        <a
          href="/kitchen-sink"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-slate-700 transition-colors duration-medical ease-medical hover:bg-slate-50"
        >
          Composants UI
        </a>
      </div>

      <footer className="mt-16 border-t border-border pt-6 text-xs text-slate-500">
        Serious Game pédagogique uniquement. Aucune donnée de patient réel.
      </footer>
    </main>
  );
}
