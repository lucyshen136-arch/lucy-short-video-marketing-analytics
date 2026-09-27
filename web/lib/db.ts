import { attachDatabasePool } from "@vercel/functions";
import { Pool, types, type QueryResult, type QueryResultRow } from "pg";

types.setTypeParser(types.builtins.DATE, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMP, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => value);
types.setTypeParser(types.builtins.INT8, (value) => (value === null ? null : Number(value)));

function toNodePgUrl(url: string): string {
  return url
    .replace(/^postgresql\+psycopg:\/\//, "postgresql://")
    .replace(/^postgres:\/\//, "postgresql://");
}

function createPool(): Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set. Configure it in Vercel project settings (or web/.env.local).");
  }
  const pool = new Pool({
    connectionString: toNodePgUrl(raw),
    max: 5,
  });
  attachDatabasePool(pool);
  return pool;
}

const globalForDb = globalThis as typeof globalThis & { pgPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = createPool();
  }
  return globalForDb.pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as never);
}
