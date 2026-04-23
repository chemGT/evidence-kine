// =============================================================================
// Evidence Kine - Preflight checks (Sprint 2 ter)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Valide l'environnement local avant de lancer `scripts/setup.mjs`.
// Checks effectues :
//   1. Version Node >= 22.12 (requis par Vite 8 / Vitest 4, cf. Sprint 1 bis).
//   2. Version npm >= 9.
//   3. Docker daemon joignable (`docker info`).
//   4. Supabase CLI disponible (`supabase --version`).
//
// Toutes les fonctions acceptent leurs dependances par injection (execSync,
// processVersion) afin d'etre testables unitairement avec Vitest, sans appel
// reseau ni child_process reel.
// =============================================================================

/**
 * Minimums supportes par le projet (cf. Sprint 1 bis : Vite 8 exige >= 22.12).
 */
export const MINIMUMS = Object.freeze({
  node: { major: 22, minor: 12, patch: 0 },
  npm: { major: 9, minor: 0, patch: 0 },
});

/**
 * Extrait un triplet {major, minor, patch} d'une chaine de version.
 * Accepte "v22.22.0", "22.22.0", "10.9.2\n", "1.200.3 (build)" ...
 * Renvoie null si aucun triplet reconnaissable n'est present.
 */
export function parseVersion(raw) {
  if (typeof raw !== "string") return null;
  const match = raw.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/**
 * Renvoie true si `version` >= `minimum` en ordre lexicographique semver
 * (major, minor, patch). `null` => false.
 */
export function meetsMinimum(version, minimum) {
  if (!version) return false;
  if (version.major !== minimum.major) return version.major > minimum.major;
  if (version.minor !== minimum.minor) return version.minor > minimum.minor;
  return version.patch >= minimum.patch;
}

function formatVersion(v) {
  return v ? `${v.major}.${v.minor}.${v.patch}` : "introuvable";
}

function formatMinimum(m) {
  return `${m.major}.${m.minor}.${m.patch}`;
}

/**
 * Verifie la version de Node a partir de `process.version`.
 * Ne fait aucun appel externe : injection simple.
 */
export function checkNodeVersion(processVersion) {
  const version = parseVersion(processVersion);
  const ok = meetsMinimum(version, MINIMUMS.node);
  return {
    name: "Node.js",
    ok,
    detail: ok
      ? `v${formatVersion(version)}`
      : `v${formatVersion(version)} detectee, requis >= ${formatMinimum(MINIMUMS.node)}. Installer une version LTS recente : https://nodejs.org`,
  };
}

/**
 * Execute une commande courte et retourne sa sortie trim, ou null en cas
 * d'echec (commande inconnue, exit code non nul).
 *
 * @param {(cmd: string, opts: object) => Buffer|string} execSync
 * @param {string} command
 */
function safeExec(execSync, command) {
  try {
    const out = execSync(command, {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 10_000,
    });
    return typeof out === "string" ? out.trim() : out.toString("utf8").trim();
  } catch {
    return null;
  }
}

export function checkNpmVersion(execSync) {
  const raw = safeExec(execSync, "npm --version");
  const version = parseVersion(raw);
  const ok = meetsMinimum(version, MINIMUMS.npm);
  return {
    name: "npm",
    ok,
    detail: ok
      ? `v${formatVersion(version)}`
      : `v${formatVersion(version)} detectee, requis >= ${formatMinimum(MINIMUMS.npm)}. Executer 'npm install -g npm@latest'.`,
  };
}

export function checkDocker(execSync) {
  const raw = safeExec(execSync, "docker info --format {{.ServerVersion}}");
  const ok = raw !== null && raw.length > 0;
  return {
    name: "Docker daemon",
    ok,
    detail: ok
      ? `server v${raw}`
      : "Docker Desktop indisponible ou non demarre. Lancer Docker Desktop puis relancer.",
  };
}

export function checkSupabaseCli(execSync) {
  const raw = safeExec(execSync, "supabase --version");
  const version = parseVersion(raw);
  const ok = version !== null;
  return {
    name: "Supabase CLI",
    ok,
    detail: ok
      ? `v${formatVersion(version)}`
      : "Supabase CLI introuvable. Installation : https://supabase.com/docs/guides/cli/getting-started",
  };
}

/**
 * Orchestre tous les checks et renvoie un rapport agrege.
 * Les dependances sont injectees pour autoriser le mocking en tests.
 *
 * @param {object} deps
 * @param {(cmd: string, opts: object) => Buffer|string} deps.execSync
 * @param {string} deps.processVersion
 * @param {object} [deps.options]
 * @param {boolean} [deps.options.skipSupabase=false] - Mode tests-only : saute
 *   Docker et Supabase CLI (utile en CI logique pure).
 */
export function runPreflight({
  execSync,
  processVersion,
  options = {},
}) {
  const { skipSupabase = false } = options;

  const checks = [
    checkNodeVersion(processVersion),
    checkNpmVersion(execSync),
  ];

  if (!skipSupabase) {
    checks.push(checkDocker(execSync));
    checks.push(checkSupabaseCli(execSync));
  }

  const ok = checks.every((c) => c.ok);
  return { ok, checks };
}
