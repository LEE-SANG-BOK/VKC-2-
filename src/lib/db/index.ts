import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type QueryClient = ReturnType<typeof postgres>;
type DbInit = {
  db: PostgresJsDatabase<typeof schema>;
  migrationClient: QueryClient;
  queryClient: QueryClient;
};

const globalForDb = globalThis as unknown as {
  vkMigrationClient?: QueryClient;
  vkQueryClient?: QueryClient;
  vkDb?: PostgresJsDatabase<typeof schema>;
};

let cached: DbInit | undefined;

function getConnectionString() {
  return (
    process.env.POSTGRES_POOL_URL ||
    process.env.DATABASE_POOL_URL ||
    process.env.DATABASE_URL
  );
}

function initDb(): DbInit {
  if (cached) return cached;

  const existing =
    globalForDb.vkDb && globalForDb.vkMigrationClient && globalForDb.vkQueryClient
      ? {
          db: globalForDb.vkDb,
          migrationClient: globalForDb.vkMigrationClient,
          queryClient: globalForDb.vkQueryClient,
        }
      : undefined;
  if (existing) {
    cached = existing;
    return existing;
  }

  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const migrationClient =
    globalForDb.vkMigrationClient ?? postgres(connectionString, { max: 1 });

  const queryClient =
    globalForDb.vkQueryClient ??
    postgres(connectionString, {
      max: Number(process.env.DB_MAX_CONNECTIONS || 5),
      idle_timeout: 20,
    });

  const db = globalForDb.vkDb ?? drizzle(queryClient, { schema });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.vkMigrationClient = migrationClient;
    globalForDb.vkQueryClient = queryClient;
    globalForDb.vkDb = db;
  }

  const created = { db, migrationClient, queryClient };
  cached = created;
  return created;
}

export function getDb() {
  return initDb().db;
}

export function getMigrationClient() {
  return initDb().migrationClient;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    const actual = initDb().db as unknown as Record<PropertyKey, unknown>;
    const value = actual[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(actual)
      : value;
  },
}) as PostgresJsDatabase<typeof schema>;

const migrationClientTarget = (() => {}) as unknown as QueryClient;
export const migrationClient = new Proxy(migrationClientTarget, {
  apply(_target, thisArg, argArray) {
    const actual = initDb().migrationClient as unknown as (
      this: unknown,
      ...args: unknown[]
    ) => unknown;
    return Reflect.apply(actual, thisArg, argArray);
  },
  get(_target, prop) {
    if (prop === 'then') return undefined;
    const actual = initDb().migrationClient as unknown as Record<
      PropertyKey,
      unknown
    >;
    const value = actual[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(actual)
      : value;
  },
}) as unknown as QueryClient;

export type DB = typeof db;
