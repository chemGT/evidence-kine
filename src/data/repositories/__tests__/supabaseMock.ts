// =============================================================================
// Evidence Kine - Test helper : mock chainable du client Supabase
// -----------------------------------------------------------------------------
// Reproduit la surface utilisee par `clinicalTestsRepo.ts` :
//   client.from(table).select(cols).eq(col, val).maybeSingle()
//   client.from(table).select(cols).eq(col, val).order(col, opts)
//
// Les tables mockees sont passees en parametre ; aucune simulation de RLS
// (ce niveau est teste en DB reelle, pas en unit tests).
// =============================================================================

import { vi } from "vitest";

import type { EvidenceKineSupabaseClient } from "@/data/repositories/clinicalTestsRepo";
import type {
  BodyRegion,
  ClinicalTest,
  Pathology,
} from "@/types/database.types";

export interface MockTables {
  body_regions?: BodyRegion[];
  pathologies?: Pathology[];
  clinical_tests?: ClinicalTest[];
}

export interface MockErrors {
  body_regions?: string;
  pathologies?: string;
  clinical_tests?: string;
}

type Row = Record<string, unknown>;

/**
 * Query builder mocke : accumule les filtres `eq()`, puis resout via
 * `maybeSingle()` (0 ou 1 ligne) ou directement (tableau) a l'execution du
 * `.order()` ou d'un `await` sur le thenable.
 */
class MockQueryBuilder<T extends Row> implements PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}> {
  private filters: Array<[string, unknown]> = [];

  constructor(
    private readonly rows: T[],
    private readonly errorMessage?: string,
  ) {}

  eq(col: string, value: unknown): this {
    this.filters.push([col, value]);
    return this;
  }

  order(
    _col: string,
    _opts?: { ascending?: boolean },
  ): Promise<{
    data: T[] | null;
    error: { message: string } | null;
  }> {
    void _col;
    void _opts;
    return Promise.resolve(this.resolveList());
  }

  maybeSingle(): Promise<{
    data: T | null;
    error: { message: string } | null;
  }> {
    const result = this.resolveList();
    if (result.error)
      return Promise.resolve({ data: null, error: result.error });
    const rows = result.data ?? [];
    const first = rows[0];
    return Promise.resolve({ data: first ?? null, error: null });
  }

  then<
    TResult1 = { data: T[] | null; error: { message: string } | null },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((value: {
          data: T[] | null;
          error: { message: string } | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.resolveList()).then(onfulfilled, onrejected);
  }

  private resolveList(): {
    data: T[] | null;
    error: { message: string } | null;
  } {
    if (this.errorMessage) {
      return { data: null, error: { message: this.errorMessage } };
    }
    const filtered = this.rows.filter((row) =>
      this.filters.every(([col, value]) => row[col] === value),
    );
    return { data: filtered, error: null };
  }
}

/**
 * Construit un mock de SupabaseClient utilisable comme un client reel par le
 * repository. `vi.fn()` est utilise pour que les tests puissent introspecter
 * les appels si besoin.
 */
export function createSupabaseClientMock(
  tables: MockTables = {},
  errors: MockErrors = {},
): EvidenceKineSupabaseClient {
  const fromFn = vi.fn((tableName: keyof MockTables | string) => {
    switch (tableName) {
      case "body_regions":
        return {
          select: vi.fn(
            () =>
              new MockQueryBuilder<BodyRegion>(
                tables.body_regions ?? [],
                errors.body_regions,
              ),
          ),
        };
      case "pathologies":
        return {
          select: vi.fn(
            () =>
              new MockQueryBuilder<Pathology>(
                tables.pathologies ?? [],
                errors.pathologies,
              ),
          ),
        };
      case "clinical_tests":
        return {
          select: vi.fn(
            () =>
              new MockQueryBuilder<ClinicalTest>(
                tables.clinical_tests ?? [],
                errors.clinical_tests,
              ),
          ),
        };
      default:
        throw new Error(`Table non mockee : ${String(tableName)}`);
    }
  });

  return { from: fromFn } as unknown as EvidenceKineSupabaseClient;
}
