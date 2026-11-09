import { loadEnvFile } from "node:process";
import { Pool } from "pg";
try {
  loadEnvFile(".env.local");
} catch {
  /* deployment environment may already be populated */
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query("DELETE FROM sessions WHERE expires_at<now()");
  await pool.query("DELETE FROM auth_tokens WHERE expires_at<now()");
  await pool.query("DELETE FROM oauth_states WHERE expires_at<now()");
  await pool.query("DELETE FROM rate_limits WHERE reset_at<now()");
  await pool.query(
    "DELETE FROM mail_outbox WHERE sent_at<now()-interval '7 days'",
  );
  console.log(
    "Expired authentication records and delivered email metadata cleaned up.",
  );
} finally {
  await pool.end();
}
