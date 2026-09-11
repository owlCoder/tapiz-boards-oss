import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { buildMysqlPoolOptions } from "@tapizlabs/app-kit/db";
import * as schema from "./schema";

type Db = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as { tapizBoardsDb?: Db };

function createDb(): Db {
  // Serverless-safe Aiven pool config (TLS + nizak connection limit) deli se
  // preko @tapizlabs/app-kit/db da se isti bootstrap ne kopira po proizvodima.
  const pool = mysql.createPool(buildMysqlPoolOptions(process.env));
  return drizzle(pool, { schema, mode: "default" });
}

function getDb(): Db {
  if (!globalForDb.tapizBoardsDb) {
    globalForDb.tapizBoardsDb = createDb();
  }
  return globalForDb.tapizBoardsDb;
}

/** Lenja inicijalizacija — konekcija se otvara tek pri prvom upitu (build prolazi bez baze). */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
