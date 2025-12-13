import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.POSTGRES_POOL_URL ||
  process.env.DATABASE_POOL_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

type QueryClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {
  vkMigrationClient?: QueryClient;
  vkQueryClient?: QueryClient;
  vkDb?: PostgresJsDatabase<typeof schema>;
};

// For migrations (keep single connection)
export const migrationClient =
  globalForDb.vkMigrationClient ?? postgres(connectionString, { max: 1 });

// For queries (pool size capped to avoid hitting Supabase limits)
const queryClient =
  globalForDb.vkQueryClient ??
  postgres(connectionString, {
    max: Number(process.env.DB_MAX_CONNECTIONS || 5),
    idle_timeout: 20,
  });

export const db = globalForDb.vkDb ?? drizzle(queryClient, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.vkMigrationClient = migrationClient;
  globalForDb.vkQueryClient = queryClient;
  globalForDb.vkDb = db;
}

export type DB = typeof db;
