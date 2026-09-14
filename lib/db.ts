import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { initialMaterials } from "./catalog";

type Param = string | number | null;
export type Row = Record<string, unknown>;
export type Connection = {
  query: <T extends Row = Row>(sql: string, params?: Param[]) => Promise<T[]>;
};
type State = { sqlite?: DatabaseSync; pool?: Pool; ready?: Promise<void>; queue: Promise<unknown> };
const globalDB = globalThis as typeof globalThis & { hulanDB?: State };
const state = (globalDB.hulanDB ??= { queue: Promise.resolve() });

const schema = [
  `CREATE TABLE IF NOT EXISTS stones (id TEXT PRIMARY KEY, name TEXT NOT NULL, english TEXT NOT NULL, color TEXT NOT NULL, light TEXT NOT NULL, description TEXT NOT NULL, price INTEGER NOT NULL CHECK(price >= 0), stock INTEGER NOT NULL CHECK(stock >= 0), active INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, token TEXT UNIQUE NOT NULL, idempotency_key TEXT UNIQUE NOT NULL, payload_hash TEXT NOT NULL, code TEXT UNIQUE NOT NULL, status TEXT NOT NULL, design TEXT NOT NULL, customer TEXT NOT NULL, quote TEXT NOT NULL, materials TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS order_events (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), status TEXT NOT NULL, actor TEXT NOT NULL, note TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (id TEXT PRIMARY KEY, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at)`,
];

function sqliteConnection(): Connection {
  return {
    query: async <T extends Row>(sql: string, params: Param[] = []) => {
      const statement = state.sqlite!.prepare(sql);
      if (/^\s*(SELECT|WITH)|RETURNING\s/i.test(sql))
        return statement.all(...params).map((row) => ({ ...row })) as T[];
      statement.run(...params);
      return [];
    },
  };
}
async function initialize() {
  if (process.env.DATABASE_URL) {
    state.pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    const client = await state.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(781204)");
      for (const sql of schema) await client.query(sql);
      for (const s of initialMaterials)
        await client.query(
          "INSERT INTO stones (id,name,english,color,light,description,price,stock,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO NOTHING",
          Object.values(s),
        );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } else {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_PREVIEW_ORDERS !== "true")
      throw new Error("Production requires DATABASE_URL.");
    const path = resolve(
      /* turbopackIgnore: true */ process.env.SQLITE_PATH || "data/hulan.sqlite",
    );
    mkdirSync(dirname(path), { recursive: true });
    state.sqlite = new DatabaseSync(path);
    state.sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    for (const sql of schema) state.sqlite.exec(sql);
    const db = sqliteConnection();
    for (const s of initialMaterials)
      await db.query(
        "INSERT INTO stones (id,name,english,color,light,description,price,stock,active) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",
        Object.values(s),
      );
  }
}

export async function withDB<T>(fn: (db: Connection) => Promise<T>): Promise<T> {
  await (state.ready ??= initialize());
  if (state.pool) {
    const client = await state.pool.connect();
    const db: Connection = {
      query: async <R extends Row>(sql: string, params: Param[] = []) => {
        let index = 0;
        const result = await client.query(
          sql.replace(/\?/g, () => `$${++index}`),
          params,
        );
        return result.rows as R[];
      },
    };
    try {
      await client.query("BEGIN");
      // Small-store write serialization protects stock, idempotency and audit transitions.
      await client.query("SELECT pg_advisory_xact_lock(781205)");
      const result = await fn(db);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  const job = state.queue.then(async () => {
    state.sqlite!.exec("BEGIN IMMEDIATE");
    try {
      const value = await fn(sqliteConnection());
      state.sqlite!.exec("COMMIT");
      return value;
    } catch (e) {
      state.sqlite!.exec("ROLLBACK");
      throw e;
    }
  });
  state.queue = job.catch(() => {});
  return job;
}
