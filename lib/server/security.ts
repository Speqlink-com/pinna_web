import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@/lib/types";
import { db } from "./db";
import { backendSession } from "./backend";
import { digest, token } from "./crypto";
export class Problem extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const cookieName =
  process.env.NODE_ENV === "production"
    ? "__Host-pinna_session"
    : "pinna_session";
export const secureCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export function appOrigin() {
  const origin = process.env.APP_ORIGIN;
  if (!origin)
    throw new Problem(
      503,
      "The application origin is not configured. Please contact support.",
    );
  return new URL(origin).origin;
}
export function checkOrigin(request: NextRequest) {
  if (request.headers.get("origin") !== appOrigin())
    throw new Problem(
      403,
      "This request could not be verified. Refresh the page and try again.",
    );
}
export async function rateLimit(scope: string, identity: string, max = 10) {
  const key = digest(`${scope}:${identity}`);
  const { rows } = await db().query(
    `INSERT INTO rate_limits (key, attempts, reset_at) VALUES ($1,1,now()+interval '15 minutes') ON CONFLICT (key) DO UPDATE SET attempts=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.attempts+1 END, reset_at=CASE WHEN rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE rate_limits.reset_at END RETURNING attempts`,
    [key],
  );
  if (rows[0].attempts > max)
    throw new Problem(
      429,
      "Too many attempts. Please try again in 15 minutes.",
    );
}
export async function getSession(): Promise<User | null> {
  return backendSession();
}
export async function requireUser(restricted = false) {
  const user = await getSession();
  if (!user) throw new Problem(401, "Sign in to continue.");
  if (!restricted && (user.mustChangePassword || user.mfaRequired))
    throw new Problem(403, "Complete your account security setup first.");
  return user;
}
export function requireRole(user: User, roles: User["role"][]) {
  if (!roles.includes(user.role))
    throw new Problem(403, "You do not have access to this action.");
}
export function nextPath(user: User) {
  return user.mustChangePassword
    ? "/change-password"
    : user.role === "BUSINESS" &&
        user.approvalStatus &&
        user.approvalStatus !== "APPROVED"
      ? "/account-status"
      : user.mfaRequired
        ? "/verify-security"
        : "/dashboard";
}
export async function newSession(userId: string, mfaVerified = false) {
  const raw = token();
  const { rows } = await db().query(
    "SELECT role,must_change_password FROM users WHERE id=$1",
    [userId],
  );
  const privileged = ["ADMIN", "SUPER_ADMIN"].includes(rows[0].role);
  const lifetime =
    rows[0].must_change_password || (privileged && !mfaVerified)
      ? 600
      : privileged
        ? 12 * 3600
        : 7 * 24 * 3600;
  await db().query(
    "INSERT INTO sessions (token_hash,user_id,mfa_verified,expires_at) VALUES ($1,$2,$3,now()+($4 * interval '1 second'))",
    [digest(raw), userId, mfaVerified, lifetime],
  );
  (await cookies()).set(cookieName, raw, { ...secureCookie, maxAge: lifetime });
}
export async function audit(
  actor: string | null,
  action: string,
  entity: string | null = null,
) {
  await db().query(
    "INSERT INTO audit_events(actor_id,action,entity_id) VALUES ($1,$2,$3)",
    [actor, action, entity],
  );
}
export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
