// =============================================================================
// Tests unitaires - scripts/lib/psqlRunner.mjs
// -----------------------------------------------------------------------------
// Les dependances (readFile, readdir, pg.Client) sont injectees : aucun appel
// reseau, aucun I/O disque reel.
// =============================================================================

import { afterEach, describe, expect, it, vi } from "vitest";
import path from "node:path";

import {
  DEFAULT_CONNECTION_STRING,
  applySeedDirectory,
  applySqlFile,
  listSeedFiles,
} from "../lib/psqlRunner.mjs";

/**
 * Factory d'un faux constructeur pg.Client instrumente.
 * Retourne { ClientCtor, instances } pour inspection.
 */
function makeClientCtor({ queryImpl, connectImpl, endImpl } = {}) {
  const instances = [];
  class FakeClient {
    constructor(opts) {
      this.opts = opts;
      this.connectCalls = 0;
      this.endCalls = 0;
      this.queries = [];
      instances.push(this);
    }
    async connect() {
      this.connectCalls += 1;
      if (connectImpl) await connectImpl(this);
    }
    async query(sql) {
      this.queries.push(sql);
      if (queryImpl) return queryImpl(sql, this);
      return { rowCount: 0, rows: [] };
    }
    async end() {
      this.endCalls += 1;
      if (endImpl) await endImpl(this);
    }
  }
  return { ClientCtor: FakeClient, instances };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("applySqlFile", () => {
  it("lit le fichier, connecte, execute, ferme", async () => {
    const readFileImpl = vi.fn(async () => "select 1;");
    const { ClientCtor, instances } = makeClientCtor();

    const result = await applySqlFile({
      filePath: "/tmp/foo.sql",
      ClientCtor,
      readFileImpl,
    });

    expect(readFileImpl).toHaveBeenCalledWith("/tmp/foo.sql", "utf8");
    expect(instances).toHaveLength(1);
    expect(instances[0].opts.connectionString).toBe(DEFAULT_CONNECTION_STRING);
    expect(instances[0].connectCalls).toBe(1);
    expect(instances[0].queries).toEqual(["select 1;"]);
    expect(instances[0].endCalls).toBe(1);
    expect(result).toEqual({ filePath: "/tmp/foo.sql", bytes: 9 });
  });

  it("respecte la connectionString fournie", async () => {
    const readFileImpl = async () => "select 2;";
    const { ClientCtor, instances } = makeClientCtor();
    await applySqlFile({
      filePath: "/a.sql",
      connectionString: "postgresql://x:y@host:5432/db",
      ClientCtor,
      readFileImpl,
    });
    expect(instances[0].opts.connectionString).toBe(
      "postgresql://x:y@host:5432/db",
    );
  });

  it("ferme le client meme si query echoue", async () => {
    const readFileImpl = async () => "boom;";
    const { ClientCtor, instances } = makeClientCtor({
      queryImpl: () => {
        throw new Error("syntax error");
      },
    });

    await expect(
      applySqlFile({ filePath: "/a.sql", ClientCtor, readFileImpl }),
    ).rejects.toThrow(/syntax error/);

    expect(instances[0].endCalls).toBe(1);
  });

  it("lance une erreur explicite si ClientCtor absent", async () => {
    await expect(
      applySqlFile({ filePath: "/a.sql", readFileImpl: async () => "" }),
    ).rejects.toThrow(/ClientCtor.*pg.Client.*requis/);
  });
});

describe("listSeedFiles", () => {
  it("filtre .sql et trie lexicographiquement", async () => {
    const readdirImpl = async () => [
      "002_cases.sql",
      "README.md",
      "001_tests.sql",
      "notes.txt",
      "003_extras.SQL",
    ];
    const files = await listSeedFiles({
      seedDir: "/seeds",
      readdirImpl,
    });
    expect(files).toEqual([
      path.join("/seeds", "001_tests.sql"),
      path.join("/seeds", "002_cases.sql"),
      path.join("/seeds", "003_extras.SQL"),
    ]);
  });

  it("retourne un tableau vide si aucun .sql", async () => {
    const readdirImpl = async () => ["README.md"];
    const files = await listSeedFiles({
      seedDir: "/seeds",
      readdirImpl,
    });
    expect(files).toEqual([]);
  });
});

describe("applySeedDirectory", () => {
  it("applique tous les fichiers dans l'ordre et appelle onStart", async () => {
    const readdirImpl = async () => ["002_b.sql", "001_a.sql"];
    const readFileImpl = async (p) => `-- ${path.basename(p)}\nselect 1;`;
    const { ClientCtor, instances } = makeClientCtor();
    const onStart = vi.fn();

    const results = await applySeedDirectory({
      seedDir: "/seeds",
      ClientCtor,
      readFileImpl,
      readdirImpl,
      onStart,
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => path.basename(r.filePath))).toEqual([
      "001_a.sql",
      "002_b.sql",
    ]);
    expect(instances).toHaveLength(2);
    expect(onStart).toHaveBeenCalledTimes(2);
    expect(onStart.mock.calls[0][0]).toContain("001_a.sql");
  });

  it("propage l'erreur en annotant le fichier fautif", async () => {
    const readdirImpl = async () => ["001_good.sql", "002_bad.sql"];
    const readFileImpl = async () => "select 1;";
    const { ClientCtor } = makeClientCtor({
      queryImpl: (_sql, client) => {
        if (client.opts.connectionString) {
          if (client.queries.length > 0 && client === latestBad) {
            throw new Error("relation does not exist");
          }
        }
        return { rowCount: 0, rows: [] };
      },
    });

    // Rewire pour echouer uniquement sur le 2eme client.
    let callCount = 0;
    let latestBad = null;
    class SequentialBadClient extends ClientCtor {
      async query(sql) {
        callCount += 1;
        if (callCount === 2) {
          latestBad = this;
          throw new Error("relation does not exist");
        }
        return super.query(sql);
      }
    }

    await expect(
      applySeedDirectory({
        seedDir: "/seeds",
        ClientCtor: SequentialBadClient,
        readFileImpl,
        readdirImpl,
      }),
    ).rejects.toThrow(/Echec seed 002_bad\.sql.*relation does not exist/);
  });

  it("ne fait aucun appel si le dossier ne contient aucun .sql", async () => {
    const readdirImpl = async () => ["README.md"];
    const { ClientCtor, instances } = makeClientCtor();
    const results = await applySeedDirectory({
      seedDir: "/seeds",
      ClientCtor,
      readFileImpl: async () => "",
      readdirImpl,
    });
    expect(results).toEqual([]);
    expect(instances).toHaveLength(0);
  });

  it("accepte une connectionString custom", async () => {
    const readdirImpl = async () => ["001.sql"];
    const readFileImpl = async () => "select 1;";
    const { ClientCtor, instances } = makeClientCtor();
    await applySeedDirectory({
      seedDir: "/seeds",
      connectionString: "postgresql://x:y@host:5432/db",
      ClientCtor,
      readFileImpl,
      readdirImpl,
    });
    expect(instances[0].opts.connectionString).toBe(
      "postgresql://x:y@host:5432/db",
    );
  });
});
