import { Pool, type PoolClient } from "pg";
const globalDb = globalThis as unknown as { pinnaPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  const pool =
    globalDb.pinnaPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  globalDb.pinnaPool = pool;
  return pool;
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
