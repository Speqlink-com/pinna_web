import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, transaction } from "./db";
import {
  token,
  digest,
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  totpSecret,
  validTotpStep,
} from "./crypto";
import {
  cookieName,
  secureCookie,
  json,
  newSession,
  requireUser,
  requireRole,
  rateLimit,
  audit,
  nextPath,
  Problem,
} from "./security";
import { requireMail } from "./mail";
import { emailSchema, passwordSchema, registerSchema } from "../validation";
import { appOrigin } from "./security";
import type { PoolClient } from "pg";
async function enqueue(
  client: PoolClient,
  email: string,
  purpose: "verify" | "reset",
  raw: string,
) {
  const link = `${appOrigin()}/${purpose === "verify" ? "verify-email" : "reset-password"}?token=${encodeURIComponent(raw)}`;
  await client.query(
    "INSERT INTO mail_outbox(recipient,subject,encrypted_body) VALUES ($1,$2,$3)",
    [
      email,
      purpose === "verify"
        ? "Verify your Pinna email"
        : "Reset your Pinna password",
      encrypt(
        `Use this link to ${purpose === "verify" ? "verify your email" : "reset your password"}:\n\n${link}\n\nExpires in ${purpose === "verify" ? "24 hours" : "30 minutes"}. If you did not request this, ignore this email.\n\nPinna by Bismart Inc.`,
      ),
    ],
  );
}
async function responseWithSession(id: string) {
  await newSession(id);
  const user = await requireUser(true);
  return json({ user, redirect: nextPath(user) });
}
export async function authPost(
  path: string,
  request: NextRequest,
  body: unknown,
) {
  if (path === "auth/register") {
    requireMail();
    const input = registerSchema.parse(body);
    await rateLimit("register", input.email, 5);
    const password = await hashPassword(input.password);
    const raw = token();
    await transaction(async (client) => {
      const exists = await client.query("SELECT id FROM users WHERE email=$1", [
        input.email,
      ]);
      if (exists.rowCount)
        throw new Problem(
          409,
          "An account already uses this email. Sign in to manage or add a business.",
        );
      const { rows } = await client.query(
        "INSERT INTO users(name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id",
        [input.name, input.email, password, input.accountType],
      );
      await client.query(
        "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES ($1,$2,'verify',now()+interval '24 hours')",
        [digest(raw), rows[0].id],
      );
      await enqueue(client, input.email, "verify", raw);
    });
    return json(
      {
        message:
          "Check your inbox. We sent a verification link to your email address.",
      },
      201,
    );
  }
  if (path === "auth/login") {
    const input = z
      .object({ email: emailSchema, password: z.string().min(1).max(128) })
      .parse(body);
    await rateLimit("login", input.email, 10);
    const { rows } = await db().query(
      "SELECT * FROM users WHERE email=$1 AND disabled=false",
      [input.email],
    );
    const user = rows[0];
    // A real scrypt calculation also runs for unknown accounts to reduce timing differences.
    const dummyHash = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;
    if (
      !(await verifyPassword(
        input.password,
        user?.password_hash ?? dummyHash,
      )) ||
      !user
    )
      throw new Problem(401, "Email or password is incorrect.");
    if (
      user.must_change_password &&
      user.temporary_password_expires_at &&
      new Date(user.temporary_password_expires_at) < new Date()
    )
      throw new Problem(
        401,
        "This temporary password has expired. Use Forgot password to request a fresh link.",
      );
    if (!user.verified_at)
      throw new Problem(
        403,
        "Verify your email before signing in. You can request a new link below.",
      );
    await audit(user.id, "SIGNED_IN");
    return responseWithSession(user.id);
  }
  if (path === "auth/logout") {
    const store = await cookies();
    const raw = store.get(cookieName)?.value;
    if (raw)
      await db().query("DELETE FROM sessions WHERE token_hash=$1", [
        digest(raw),
      ]);
    store.set(cookieName, "", {
      ...secureCookie,
      maxAge: 0,
      expires: new Date(0),
    });
    return json({ redirect: "/sign-in" });
  }
  if (path === "auth/forgot-password" || path === "auth/resend-verification") {
    requireMail();
    const { email } = z.object({ email: emailSchema }).parse(body);
    await rateLimit(path, email, 4);
    const purpose = path === "auth/forgot-password" ? "reset" : "verify";
    await transaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM users WHERE email=$1 AND disabled=false FOR UPDATE",
        [email],
      );
      if (
        !rows[0] ||
        (purpose === "verify" && rows[0].verified_at) ||
        (purpose === "reset" && !rows[0].password_hash)
      )
        return;
      const raw = token();
      await client.query(
        "DELETE FROM auth_tokens WHERE user_id=$1 AND purpose=$2",
        [rows[0].id, purpose],
      );
      await client.query(
        `INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES ($1,$2,$3,now()+$4::interval)`,
        [
          digest(raw),
          rows[0].id,
          purpose,
          purpose === "verify" ? "24 hours" : "30 minutes",
        ],
      );
      await enqueue(client, email, purpose, raw);
    });
    return json({
      message:
        "If an eligible account exists, a new link will arrive in your inbox shortly.",
    });
  }
  if (path === "auth/verify-email" || path === "auth/reset-password") {
    const input = z
      .object({
        token: z.string().min(20).max(200),
        password: passwordSchema.optional(),
      })
      .parse(body);
    const purpose = path === "auth/verify-email" ? "verify" : "reset";
    if (purpose === "reset" && !input.password)
      throw new Problem(400, "Enter your new password.");
    const hash = input.password ? await hashPassword(input.password) : null;
    await transaction(async (client) => {
      const { rows } = await client.query(
        "DELETE FROM auth_tokens WHERE token_hash=$1 AND purpose=$2 AND expires_at>now() RETURNING user_id",
        [digest(input.token), purpose],
      );
      if (!rows[0])
        throw new Problem(
          400,
          "This link is invalid or expired. Request a new one.",
        );
      if (purpose === "verify")
        await client.query("UPDATE users SET verified_at=now() WHERE id=$1", [
          rows[0].user_id,
        ]);
      else {
        await client.query(
          "UPDATE users SET password_hash=$1,must_change_password=false,verified_at=coalesce(verified_at,now()) WHERE id=$2",
          [hash, rows[0].user_id],
        );
        await client.query("DELETE FROM sessions WHERE user_id=$1", [
          rows[0].user_id,
        ]);
        await client.query("DELETE FROM auth_tokens WHERE user_id=$1", [
          rows[0].user_id,
        ]);
      }
    });
    return json({
      message:
        purpose === "verify"
          ? "Your email is verified. You can now sign in."
          : "Password updated. Sign in with your new password.",
    });
  }
  if (path === "auth/change-password") {
    const user = await requireUser(true);
    await rateLimit("change-password", user.id, 8);
    const input = z
      .object({
        currentPassword: z.string().min(1).max(128),
        password: passwordSchema,
      })
      .parse(body);
    await transaction(async (client) => {
      const { rows } = await client.query(
        "SELECT password_hash FROM users WHERE id=$1 FOR UPDATE",
        [user.id],
      );
      if (
        !(await verifyPassword(
          input.currentPassword,
          rows[0].password_hash ?? "",
        ))
      )
        throw new Problem(400, "Your current password is incorrect.");
      if (input.currentPassword === input.password)
        throw new Problem(
          400,
          "Choose a password different from your temporary password.",
        );
      await client.query(
        "UPDATE users SET password_hash=$1,must_change_password=false WHERE id=$2",
        [await hashPassword(input.password), user.id],
      );
      await client.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
      await client.query("DELETE FROM auth_tokens WHERE user_id=$1", [user.id]);
    });
    await audit(user.id, "PASSWORD_CHANGED");
    return responseWithSession(user.id);
  }
  if (path === "auth/mfa/setup") {
    const user = await requireUser(true);
    requireRole(user, ["ADMIN", "SUPER_ADMIN"]);
    if (user.mustChangePassword)
      throw new Problem(403, "Change your temporary password first.");
    if (user.mfaEnrolled)
      throw new Problem(409, "An authenticator is already connected.");
    const secret = totpSecret();
    await db().query(
      "UPDATE users SET mfa_pending=$1 WHERE id=$2 AND mfa_secret IS NULL",
      [encrypt(secret), user.id],
    );
    return json({
      secret,
      uri: `otpauth://totp/Pinna:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Pinna&algorithm=SHA1&digits=6&period=30`,
    });
  }
  if (path === "auth/mfa/verify") {
    const user = await requireUser(true);
    requireRole(user, ["ADMIN", "SUPER_ADMIN"]);
    if (user.mustChangePassword)
      throw new Problem(403, "Change your temporary password first.");
    await rateLimit("mfa", user.id, 6);
    const { code } = z
      .object({ code: z.string().trim().min(6).max(80) })
      .parse(body);
    const recoveryCodes: string[] = [];
    const cookie = (await cookies()).get(cookieName)?.value;
    await transaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM users WHERE id=$1 FOR UPDATE",
        [user.id],
      );
      const account = rows[0];
      const recovery = account.recovery_hashes.includes(digest(code));
      const secret = account.mfa_secret ?? account.mfa_pending;
      const step = secret ? validTotpStep(decrypt(secret), code) : null;
      if (
        !recovery &&
        (!secret || step === null || Number(account.mfa_last_step ?? 0) >= step)
      )
        throw new Problem(
          400,
          "This code is invalid or has already been used. Try the next code.",
        );
      if (!account.mfa_secret) {
        for (let i = 0; i < 8; i++) recoveryCodes.push(token().slice(0, 16));
        await client.query(
          "UPDATE users SET mfa_secret=mfa_pending,mfa_pending=NULL,recovery_hashes=$1,mfa_last_step=$2 WHERE id=$3",
          [recoveryCodes.map(digest), step, user.id],
        );
        await client.query(
          "DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2",
          [user.id, digest(cookie!)],
        );
      } else if (recovery)
        await client.query(
          "UPDATE users SET recovery_hashes=array_remove(recovery_hashes,$1) WHERE id=$2",
          [digest(code), user.id],
        );
      else
        await client.query("UPDATE users SET mfa_last_step=$1 WHERE id=$2", [
          step,
          user.id,
        ]);
      await client.query("DELETE FROM sessions WHERE token_hash=$1", [
        digest(cookie!),
      ]);
    });
    await newSession(user.id, true);
    await audit(user.id, "MFA_VERIFIED");
    return json({ redirect: "/dashboard", recoveryCodes });
  }
  throw new Problem(404, "This endpoint does not exist.");
}
