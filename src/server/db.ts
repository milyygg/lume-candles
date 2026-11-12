import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
type Row = Record<string, string | number | null>;
export interface DB {
  query<T = Row>(
    sql: string,
    values?: (string | number | null)[],
  ): Promise<T[]>;
}
let instance: DB | undefined;
let ready: Promise<void> | undefined;
export function getDB(): DB {
  if (instance) return instance;
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    instance = {
      async query<T>(sql: string, values = []) {
        let i = 0;
        return (
          await pool.query(
            sql.replace(/\?/g, () => `$${++i}`),
            values,
          )
        ).rows as T[];
      },
    };
  } else {
    if (process.env.ORDER_MODE === "real") throw new Error("CONFIG_DATABASE");
    const file = path.resolve(
      /* turbopackIgnore: true */ process.env.SQLITE_PATH ||
        "./data/lume.sqlite",
    );
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    const sqlite = new DatabaseSync(file);
    sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
    instance = {
      async query<T>(sql: string, values = []) {
        return sqlite.prepare(sql).all(...values) as T[];
      },
    };
  }
  return instance;
}
export async function db(): Promise<DB> {
  const connection = getDB();
  if (!ready)
    ready = (async () => {
      await connection.query(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, request_hash TEXT NOT NULL,
      created_at BIGINT NOT NULL, mode TEXT NOT NULL, payload TEXT NOT NULL,
      total INTEGER NOT NULL, notification TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt BIGINT NOT NULL DEFAULT 0, lease_until BIGINT NOT NULL DEFAULT 0
    )`);
      await connection.query(
        "CREATE INDEX IF NOT EXISTS orders_pending ON orders(notification, next_attempt)",
      );
      await connection.query(
        "CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at BIGINT NOT NULL)",
      );
    })().catch((error) => {
      ready = undefined;
      throw error;
    });
  await ready;
  return connection;
}
