import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.POSTGRES_POOL_URL ||
  process.env.DATABASE_POOL_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// For migrations (keep single connection)
export const migrationClient = postgres(connectionString, { max: 1 });

// For queries (pool size capped to avoid hitting Supabase limits)
const queryClient = postgres(connectionString, {
  max: Number(process.env.DB_MAX_CONNECTIONS || 5),
  idle_timeout: 20,
});
export const db = drizzle(queryClient, { schema });

export type DB = typeof db;
