#!/usr/bin/env node
// =============================================================================
// Evidence Kine - Script d'installation reproductible (Sprint 2 ter)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Bootstrap complet de la stack locale en une commande, cross-plateforme :
//
//   1. Preflight   : Node >= 22.12, npm >= 9, Docker, Supabase CLI.
//   2. Env         : cree .env.local depuis .env.example (non ecrase).
//   3. Deps        : npm install (skip si --skip-deps).
//   4. Supabase    : supabase start (idempotent, detecte si deja up).
//   5. Migration   : supabase db reset --no-seed (respecte seed/*.sql custom).
//   6. Seeds       : applique tous supabase/seed/*.sql via driver pg.
//   7. Types       : regenere src/types/database.types.ts.
//   8. Smoke test  : npm test (s'assure que la stack logique passe).
//
// Flags CLI :
//   --skip-deps        : saute npm install.
//   --skip-supabase    : saute Docker + Supabase (mode tests-only, utile CI).
//   --reset            : force supabase db reset meme si la DB a deja des tables.
//   --verbose          : affiche la sortie complete des sous-commandes.
// =============================================================================

import { execSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runPreflight } from "./lib/preflight.mjs";
import {
  applySeedDirectory,
  DEFAULT_CONNECTION_STRING,
} from "./lib/psqlRunner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const COLORS = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

const ARGS = parseArgs(process.argv.slice(2));

async function main() {
  banner();

  // --- 1. Preflight --------------------------------------------------------
  step("1/8", "Preflight checks");
  const preflight = runPreflight({
    execSync,
    processVersion: process.version,
    options: { skipSupabase: ARGS.skipSupabase },
  });
  for (const check of preflight.checks) {
    reportCheck(check);
  }
  if (!preflight.ok) {
    fail(
      "Preflight echoue. Corriger les points ci-dessus puis relancer `npm run setup`.",
    );
  }

  // --- 2. .env.local bootstrap --------------------------------------------
  step("2/8", "Bootstrap .env.local");
  const envLocal = path.join(ROOT, ".env.local");
  const envExample = path.join(ROOT, ".env.example");
  if (existsSync(envLocal)) {
    info(".env.local deja present : on ne l'ecrase pas.");
  } else if (!existsSync(envExample)) {
    fail(".env.example introuvable, impossible de bootstraper .env.local.");
  } else {
    copyFileSync(envExample, envLocal);
    info(".env.local cree depuis .env.example.");
  }

  // --- 3. npm install ------------------------------------------------------
  step("3/8", "Dependances npm");
  if (ARGS.skipDeps) {
    info("--skip-deps : npm install saute.");
  } else {
    run("npm", ["install", "--no-audit", "--no-fund"], { cwd: ROOT });
  }

  // --- Mode tests-only : on s'arrete avant Docker -------------------------
  if (ARGS.skipSupabase) {
    step("4-7/8", "Supabase (saute : --skip-supabase)");
    info("Stack Supabase non demarree. Tests purs uniquement.");
    step("8/8", "Smoke test Vitest");
    run("npm", ["test"], { cwd: ROOT });
    summary({ skippedSupabase: true });
    return;
  }

  // --- 4. supabase start ---------------------------------------------------
  step("4/8", "Stack Supabase locale");
  const isRunning = detectSupabaseRunning();
  if (isRunning) {
    info("Stack deja demarree (detectee via `supabase status`).");
  } else {
    run("npx", ["supabase", "start"], { cwd: ROOT });
  }

  // --- 5. Migrations -------------------------------------------------------
  step("5/8", "Migrations (supabase db reset --no-seed)");
  run("npx", ["supabase", "db", "reset", "--no-seed"], { cwd: ROOT });

  // --- 6. Seeds -----------------------------------------------------------
  step("6/8", "Seeds cliniques");
  const { Client } = await import("pg");
  const seedDir = path.join(ROOT, "supabase", "seed");
  const applied = await applySeedDirectory({
    seedDir,
    connectionString: DEFAULT_CONNECTION_STRING,
    ClientCtor: Client,
    onStart: (filePath) =>
      info(`  -> ${path.basename(filePath)}`),
  });
  info(`${applied.length} seed(s) applique(s).`);

  // --- 7. Types generes ---------------------------------------------------
  step("7/8", "Generation src/types/database.types.ts");
  regenerateTypes();

  // --- 8. Smoke test ------------------------------------------------------
  step("8/8", "Smoke test Vitest");
  run("npm", ["test"], { cwd: ROOT });

  summary({ skippedSupabase: false });
}

// ---------------------------------------------------------------------------
// Helpers CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  return {
    skipDeps: argv.includes("--skip-deps"),
    skipSupabase: argv.includes("--skip-supabase"),
    reset: argv.includes("--reset"),
    verbose: argv.includes("--verbose"),
  };
}

function detectSupabaseRunning() {
  try {
    const out = execSync("npx supabase status", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 15_000,
    });
    return /API URL/i.test(out) && /DB URL/i.test(out);
  } catch {
    return false;
  }
}

function regenerateTypes() {
  const outFile = path.join(ROOT, "src", "types", "database.types.ts");
  const result = spawnSync(
    "npx",
    ["supabase", "gen", "types", "typescript", "--local"],
    {
      cwd: ROOT,
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );
  if (result.status !== 0) {
    fail(
      `supabase gen types a echoue (exit ${result.status}). stderr:\n${result.stderr ?? ""}`,
    );
  }
  writeFileSync(outFile, result.stdout, "utf8");
  info(`Types ecrits dans ${path.relative(ROOT, outFile)}`);
}

function run(cmd, args, opts = {}) {
  const shell = process.platform === "win32";
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell,
    ...opts,
  });
  if (result.status !== 0) {
    fail(`Commande \`${cmd} ${args.join(" ")}\` a echoue (exit ${result.status}).`);
  }
}

function step(tag, label) {
  process.stdout.write(
    `\n${COLORS.cyan}${COLORS.bold}[${tag}]${COLORS.reset} ${label}\n`,
  );
}

function reportCheck(check) {
  const mark = check.ok ? `${COLORS.green}OK${COLORS.reset}` : `${COLORS.red}KO${COLORS.reset}`;
  process.stdout.write(`  ${mark}  ${check.name}  ${COLORS.gray}${check.detail}${COLORS.reset}\n`);
}

function info(msg) {
  process.stdout.write(`  ${COLORS.gray}${msg}${COLORS.reset}\n`);
}

function fail(msg) {
  process.stderr.write(`\n${COLORS.red}${COLORS.bold}[ERREUR]${COLORS.reset} ${msg}\n`);
  process.exit(1);
}

function banner() {
  process.stdout.write(
    `\n${COLORS.bold}Evidence Kine — setup local${COLORS.reset} ${COLORS.gray}(Serious Game pedagogique uniquement)${COLORS.reset}\n`,
  );
}

function summary({ skippedSupabase }) {
  process.stdout.write(
    `\n${COLORS.green}${COLORS.bold}Setup termine avec succes.${COLORS.reset}\n`,
  );
  if (skippedSupabase) {
    process.stdout.write(
      `${COLORS.gray}Mode tests-only : Supabase non demarree.${COLORS.reset}\n`,
    );
    return;
  }
  process.stdout.write(
    `${COLORS.gray}  Studio     : http://127.0.0.1:54323${COLORS.reset}\n` +
      `${COLORS.gray}  API REST   : http://127.0.0.1:54321${COLORS.reset}\n` +
      `${COLORS.gray}  Postgres   : ${DEFAULT_CONNECTION_STRING}${COLORS.reset}\n` +
      `\n${COLORS.bold}Prochaine etape${COLORS.reset} : \`npm run dev\`\n`,
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
