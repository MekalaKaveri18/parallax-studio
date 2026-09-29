import "server-only";
import { Pool, type PoolConfig } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

/**
 * Supabase (and most hosted Postgres) requires TLS, but its CA isn't in Node's
 * trust store. `sslmode` in the URL would override our settings, so strip it and
 * configure TLS explicitly for any non-local host.
 */
function poolConfig(): PoolConfig {
  const raw = process.env.DATABASE_URL;
  if (!raw) return {};
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  return {
    connectionString: url.toString(),
    ssl: local ? undefined : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
  };
}

/** One pool per server instance (reused across dev hot reloads). */
export const pool = globalForPg.pgPool ?? new Pool(poolConfig());

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;
