import { loadEnvFile } from "node:process";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Pool } from "pg";
try {
  loadEnvFile(".env.local");
} catch {
  /* deployment environment may already be populated */
}
if (!process.env.DATABASE_URL)
  throw new Error("Set DATABASE_URL in .env.local before running migrations.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('pinna-schema-v1'))",
  );
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const existing = await client.query(
    "SELECT checksum FROM schema_migrations WHERE version=1",
  );
  if (existing.rows[0] && existing.rows[0].checksum !== checksum)
    throw new Error(
      "Applied migration 1 has changed. Add a new versioned migration rather than editing an applied schema.",
    );
  if (!existing.rowCount) {
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations(version,checksum) VALUES (1,$1)",
      [checksum],
    );
  }
  await client.query("COMMIT");
  console.log("Pinna database schema is ready.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
