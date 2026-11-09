import { loadEnvFile } from "node:process";
try {
  loadEnvFile(".env.local");
} catch {
  /* environment may already be populated */
}
const { db } = await import("../lib/server/db");
const { hashPassword } = await import("../lib/server/crypto");
if (
  !process.env.SUPER_ADMIN_EMAIL ||
  !process.env.SUPER_ADMIN_PASSWORD ||
  !process.env.AUTH_ENCRYPTION_KEY
)
  throw new Error(
    "Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD and AUTH_ENCRYPTION_KEY privately before seeding.",
  );
const { passwordSchema } = await import("../lib/validation");
passwordSchema.parse(process.env.SUPER_ADMIN_PASSWORD);
await db().query(
  "INSERT INTO users(name,email,password_hash,role,verified_at,must_change_password) VALUES ($1,$2,$3,'SUPER_ADMIN',now(),true) ON CONFLICT (email) DO NOTHING",
  [
    process.env.SUPER_ADMIN_NAME ?? "Platform owner",
    process.env.SUPER_ADMIN_EMAIL.toLowerCase().trim(),
    await hashPassword(process.env.SUPER_ADMIN_PASSWORD),
  ],
);
console.log(
  "Super Admin seed complete. Existing accounts are never elevated or overwritten. Change your password and enroll an authenticator at first sign-in.",
);
await db().end();
