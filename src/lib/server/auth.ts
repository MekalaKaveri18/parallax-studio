import "server-only";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import { nextCookies } from "better-auth/next-js";
import { pool } from "./db";

export const auth = betterAuth({
  appName: "Parallax",
  database: pool,
  baseURL: {
    allowedHosts: ["localhost:3000", "127.0.0.1:3000", "*.vercel.app"],
    fallback: process.env.BETTER_AUTH_URL,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
  },
  plugins: [nextCookies()],
});

let schemaReady: Promise<void> | null = null;

/**
 * Create auth + app tables on first use, so a fresh database (e.g. a new Neon
 * project on Vercel) works without a manual migration step. Memoized per instance.
 */
export function ensureSchema() {
  schemaReady ??= (async () => {
    const run = async () => {
      const { runMigrations } = await getMigrations(auth.options);
      await runMigrations();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS studio_state (
          user_id    TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
          credits    INTEGER NOT NULL,
          plan       TEXT NOT NULL,
          assets     JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
    };
    try {
      await run();
    } catch (e) {
      // Another instance may be migrating concurrently; one retry settles it.
      console.warn("Schema migration retry after error:", e);
      await run();
    }
  })().catch((e) => {
    schemaReady = null; // let the next request try again
    throw e;
  });
  return schemaReady;
}
