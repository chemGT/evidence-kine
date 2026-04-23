// =============================================================================
// Evidence Kine - Applicateur de seeds SQL (Sprint 2 ter)
// -----------------------------------------------------------------------------
// Serious Game pedagogique uniquement. Aucune donnee de patient reel.
//
// Applique en lecture directe Postgres (port 54322 de la stack Supabase locale)
// tous les fichiers `supabase/seed/*.sql` dans l'ordre lexicographique.
//
// Pourquoi pas `psql` ?
//   - Binary pas garanti dans le PATH sous Windows PowerShell.
//   - `supabase db execute -f` depend de la version de la CLI.
//   - Le driver `pg` est pur JS, cross-plateforme, et injectable pour les tests.
//
// Les dependances (Client pg, readFile, readdir) sont injectees pour permettre
// un mocking complet en Vitest.
// =============================================================================

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Connection string par defaut du Postgres embarque par `supabase start`.
 * (Port 54322, cf. supabase/config.toml.)
 */
export const DEFAULT_CONNECTION_STRING =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * Applique UN fichier SQL en une seule transaction implicite.
 * Le contenu est passe tel quel a `client.query` (multi-statements autorises
 * par le protocole Postgres simple).
 *
 * @param {object} args
 * @param {string} args.filePath - Chemin absolu du fichier SQL.
 * @param {string} [args.connectionString] - URL Postgres. Defaut : Supabase local.
 * @param {Function} [args.ClientCtor] - Constructeur compatible `pg.Client`.
 * @param {Function} [args.readFileImpl] - Lecteur de fichier async (defaut fs).
 *
 * @returns {Promise<{filePath: string, bytes: number}>}
 */
export async function applySqlFile({
  filePath,
  connectionString = DEFAULT_CONNECTION_STRING,
  ClientCtor,
  readFileImpl = readFile,
}) {
  if (!ClientCtor) {
    throw new Error(
      "applySqlFile : ClientCtor (pg.Client) est requis. Installer 'pg' et l'injecter.",
    );
  }

  const sql = await readFileImpl(filePath, "utf8");
  const client = new ClientCtor({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
  return { filePath, bytes: sql.length };
}

/**
 * Liste les seeds d'un dossier (ordre lexicographique stable) et retourne
 * leurs chemins absolus. Filtre sur l'extension `.sql`.
 *
 * @param {object} args
 * @param {string} args.seedDir - Dossier contenant les seeds.
 * @param {Function} [args.readdirImpl] - `readdir` async (defaut fs).
 *
 * @returns {Promise<string[]>} chemins absolus tries.
 */
export async function listSeedFiles({ seedDir, readdirImpl = readdir }) {
  const entries = await readdirImpl(seedDir);
  return entries
    .filter((name) => name.toLowerCase().endsWith(".sql"))
    .sort()
    .map((name) => path.join(seedDir, name));
}

/**
 * Applique tous les seeds d'un dossier. Arrete au premier echec et propage
 * l'erreur en annotant le fichier fautif.
 *
 * @param {object} args
 * @param {string} args.seedDir
 * @param {string} [args.connectionString]
 * @param {Function} args.ClientCtor
 * @param {Function} [args.readFileImpl]
 * @param {Function} [args.readdirImpl]
 * @param {(msg: string) => void} [args.onStart] - hook progress (par fichier).
 *
 * @returns {Promise<Array<{filePath: string, bytes: number}>>}
 */
export async function applySeedDirectory({
  seedDir,
  connectionString = DEFAULT_CONNECTION_STRING,
  ClientCtor,
  readFileImpl = readFile,
  readdirImpl = readdir,
  onStart,
}) {
  const files = await listSeedFiles({ seedDir, readdirImpl });
  const results = [];
  for (const filePath of files) {
    if (onStart) onStart(filePath);
    try {
      const result = await applySqlFile({
        filePath,
        connectionString,
        ClientCtor,
        readFileImpl,
      });
      results.push(result);
    } catch (error) {
      const wrapped = new Error(
        `Echec seed ${path.basename(filePath)} : ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof Error) wrapped.cause = error;
      throw wrapped;
    }
  }
  return results;
}
