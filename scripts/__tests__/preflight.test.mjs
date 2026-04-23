// =============================================================================
// Tests unitaires - scripts/lib/preflight.mjs
// -----------------------------------------------------------------------------
// Couvrent :
//   - parseVersion  : formats normaux, bruites, entrees invalides.
//   - meetsMinimum  : ordre major/minor/patch, egalite, null.
//   - check*        : tous les chemins (ok / ko / commande absente).
//   - runPreflight  : agregation + mode skipSupabase.
// =============================================================================

import { describe, expect, it, vi } from "vitest";
import {
  MINIMUMS,
  checkDocker,
  checkNodeVersion,
  checkNpmVersion,
  checkSupabaseCli,
  meetsMinimum,
  parseVersion,
  runPreflight,
} from "../lib/preflight.mjs";

describe("parseVersion", () => {
  it.each([
    ["v22.22.0", { major: 22, minor: 22, patch: 0 }],
    ["22.22.0", { major: 22, minor: 22, patch: 0 }],
    ["10.9.2\n", { major: 10, minor: 9, patch: 2 }],
    ["1.200.3 (build abc)", { major: 1, minor: 200, patch: 3 }],
    ["supabase version 1.200.3", { major: 1, minor: 200, patch: 3 }],
  ])("extrait le triplet de '%s'", (raw, expected) => {
    expect(parseVersion(raw)).toEqual(expected);
  });

  it.each([null, undefined, 22, {}, "", "no-digits-here"])(
    "retourne null pour entree invalide %p",
    (raw) => {
      expect(parseVersion(raw)).toBeNull();
    },
  );
});

describe("meetsMinimum", () => {
  it("true quand major > minimum", () => {
    expect(
      meetsMinimum({ major: 23, minor: 0, patch: 0 }, MINIMUMS.node),
    ).toBe(true);
  });
  it("false quand major < minimum", () => {
    expect(
      meetsMinimum({ major: 20, minor: 99, patch: 99 }, MINIMUMS.node),
    ).toBe(false);
  });
  it("true quand major egal et minor superieur", () => {
    expect(
      meetsMinimum({ major: 22, minor: 13, patch: 0 }, MINIMUMS.node),
    ).toBe(true);
  });
  it("false quand major egal et minor inferieur", () => {
    expect(
      meetsMinimum({ major: 22, minor: 11, patch: 99 }, MINIMUMS.node),
    ).toBe(false);
  });
  it("true quand major et minor egaux et patch >= minimum", () => {
    expect(
      meetsMinimum({ major: 22, minor: 12, patch: 0 }, MINIMUMS.node),
    ).toBe(true);
  });
  it("false quand major et minor egaux et patch < minimum", () => {
    const tighter = { major: 22, minor: 12, patch: 5 };
    expect(meetsMinimum({ major: 22, minor: 12, patch: 4 }, tighter)).toBe(
      false,
    );
  });
  it("false pour version null", () => {
    expect(meetsMinimum(null, MINIMUMS.node)).toBe(false);
  });
});

describe("checkNodeVersion", () => {
  it("ok pour v22.22.0", () => {
    const result = checkNodeVersion("v22.22.0");
    expect(result.ok).toBe(true);
    expect(result.name).toBe("Node.js");
    expect(result.detail).toContain("22.22.0");
  });
  it("ko pour v20.10.0 avec message actionnable", () => {
    const result = checkNodeVersion("v20.10.0");
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("nodejs.org");
    expect(result.detail).toContain("22.12.0");
  });
  it("ko pour entree non parsable", () => {
    const result = checkNodeVersion("");
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("introuvable");
  });
});

/**
 * Fabrique un execSync mock qui renvoie une sortie par commande.
 * Lance une erreur si une commande n'est pas declaree (simulate : command not found).
 */
function mockExecSync(map) {
  return (command) => {
    for (const [pattern, output] of Object.entries(map)) {
      if (command.startsWith(pattern)) {
        if (output === null) {
          const err = new Error(`Command failed: ${command}`);
          throw err;
        }
        return output;
      }
    }
    throw new Error(`Unhandled mock command: ${command}`);
  };
}

describe("checkNpmVersion", () => {
  it("ok pour 10.9.2", () => {
    const exec = mockExecSync({ "npm --version": "10.9.2\n" });
    const result = checkNpmVersion(exec);
    expect(result.ok).toBe(true);
    expect(result.detail).toContain("10.9.2");
  });
  it("ko pour 8.0.0 avec suggestion d'upgrade", () => {
    const exec = mockExecSync({ "npm --version": "8.0.0\n" });
    const result = checkNpmVersion(exec);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("npm@latest");
  });
  it("ko si la commande echoue", () => {
    const exec = mockExecSync({ "npm --version": null });
    const result = checkNpmVersion(exec);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("introuvable");
  });
  it("retourne la sortie detendue meme si execSync renvoie un Buffer", () => {
    const exec = () => Buffer.from("10.9.2\n", "utf8");
    const result = checkNpmVersion(exec);
    expect(result.ok).toBe(true);
  });
});

describe("checkDocker", () => {
  it("ok si docker info renvoie une version serveur", () => {
    const exec = mockExecSync({ "docker info": "27.0.3" });
    const result = checkDocker(exec);
    expect(result.ok).toBe(true);
    expect(result.detail).toContain("27.0.3");
  });
  it("ko si docker info echoue (daemon off)", () => {
    const exec = mockExecSync({ "docker info": null });
    const result = checkDocker(exec);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("Docker Desktop");
  });
  it("ko si docker info renvoie une chaine vide", () => {
    const exec = mockExecSync({ "docker info": "" });
    const result = checkDocker(exec);
    expect(result.ok).toBe(false);
  });
});

describe("checkSupabaseCli", () => {
  it("ok si supabase --version renvoie un triplet", () => {
    const exec = mockExecSync({ "supabase --version": "1.200.3\n" });
    const result = checkSupabaseCli(exec);
    expect(result.ok).toBe(true);
    expect(result.detail).toContain("1.200.3");
  });
  it("ko si CLI introuvable", () => {
    const exec = mockExecSync({ "supabase --version": null });
    const result = checkSupabaseCli(exec);
    expect(result.ok).toBe(false);
    expect(result.detail).toContain("supabase.com");
  });
  it("ko si la sortie ne contient pas de triplet", () => {
    const exec = mockExecSync({ "supabase --version": "unknown" });
    const result = checkSupabaseCli(exec);
    expect(result.ok).toBe(false);
  });
});

describe("runPreflight", () => {
  const fullyOk = {
    "npm --version": "10.9.2\n",
    "docker info": "27.0.3",
    "supabase --version": "1.200.3\n",
  };

  it("agrege ok=true quand tout passe", () => {
    const result = runPreflight({
      execSync: mockExecSync(fullyOk),
      processVersion: "v22.22.0",
    });
    expect(result.ok).toBe(true);
    expect(result.checks).toHaveLength(4);
  });

  it("agrege ok=false si un seul check echoue", () => {
    const result = runPreflight({
      execSync: mockExecSync({ ...fullyOk, "docker info": null }),
      processVersion: "v22.22.0",
    });
    expect(result.ok).toBe(false);
    const docker = result.checks.find((c) => c.name === "Docker daemon");
    expect(docker?.ok).toBe(false);
  });

  it("mode skipSupabase : ne verifie pas Docker ni CLI", () => {
    const exec = vi.fn(mockExecSync({ "npm --version": "10.9.2\n" }));
    const result = runPreflight({
      execSync: exec,
      processVersion: "v22.22.0",
      options: { skipSupabase: true },
    });
    expect(result.ok).toBe(true);
    expect(result.checks).toHaveLength(2);
    expect(exec).toHaveBeenCalledTimes(1);
    expect(exec).toHaveBeenCalledWith(
      "npm --version",
      expect.any(Object),
    );
  });

  it("remonte ok=false si Node trop ancien meme en skipSupabase", () => {
    const result = runPreflight({
      execSync: mockExecSync({ "npm --version": "10.9.2\n" }),
      processVersion: "v20.10.0",
      options: { skipSupabase: true },
    });
    expect(result.ok).toBe(false);
  });
});
