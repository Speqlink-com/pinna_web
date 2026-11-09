import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db, transaction } from "./db";
import { token, digest } from "./crypto";
import {
  appOrigin,
  newSession,
  secureCookie,
  getSession,
  nextPath,
  rateLimit,
  Problem,
} from "./security";
const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
export async function googleStart(request: NextRequest) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    return NextResponse.redirect(
      new URL("/sign-in?error=google-unavailable", appOrigin()),
    );
  const intent =
    request.nextUrl.searchParams.get("intent") === "register"
      ? "register"
      : "login";
  if (
    intent === "register" &&
    request.nextUrl.searchParams.get("consent") !== "true"
  )
    throw new Problem(
      400,
      "Accept the terms and privacy notice before creating an account.",
    );
  const accountType =
    request.nextUrl.searchParams.get("account") === "BUSINESS"
      ? "BUSINESS"
      : "USER";
  const state = token(),
    nonce = token(),
    verifier = token();
  await db().query(
    "INSERT INTO oauth_states(state_hash,nonce,verifier,account_type,intent,expires_at) VALUES ($1,$2,$3,$4,$5,now()+interval '10 minutes')",
    [digest(state), nonce, verifier, accountType, intent],
  );
  (await cookies()).set("pinna_oauth", state, { ...secureCookie, maxAge: 600 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${appOrigin()}/api/v1/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: Buffer.from(digest(verifier), "hex").toString("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return NextResponse.redirect(url);
}
export async function googleCallback(request: NextRequest) {
  const store = await cookies();
  const state = request.nextUrl.searchParams.get("state");
  const cookie = store.get("pinna_oauth")?.value;
  store.delete("pinna_oauth");
  if (!state || state !== cookie)
    return NextResponse.redirect(
      new URL("/sign-in?error=google-failed", appOrigin()),
    );
  const { rows } = await db().query(
    "DELETE FROM oauth_states WHERE state_hash=$1 AND expires_at>now() RETURNING *",
    [digest(state)],
  );
  const flow = rows[0];
  const code = request.nextUrl.searchParams.get("code");
  if (!flow || !code)
    return NextResponse.redirect(
      new URL("/sign-in?error=google-failed", appOrigin()),
    );
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appOrigin()}/api/v1/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: flow.verifier,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("GOOGLE_EXCHANGE_FAILED");
    const tokens = await response.json();
    const { payload } = await jwtVerify(tokens.id_token, jwks, {
      audience: process.env.GOOGLE_CLIENT_ID,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });
    if (
      payload.nonce !== flow.nonce ||
      !payload.sub ||
      typeof payload.email !== "string" ||
      payload.email_verified !== true
    )
      throw new Error("GOOGLE_IDENTITY_INVALID");
    const email = payload.email.toLowerCase();
    await rateLimit("google", email, 15);
    const userId = await transaction(async (client) => {
      const { rows } = await client.query(
        "SELECT * FROM users WHERE google_sub=$1 OR email=$2 FOR UPDATE",
        [payload.sub, email],
      );
      const user = rows[0];
      if (user) {
        // Existing password accounts must explicitly link an identity in a future account flow.
        if (user.disabled || user.google_sub !== payload.sub)
          throw new Error("USE_EXISTING_SIGN_IN");
        return user.id;
      }
      if (flow.intent !== "register") throw new Error("REGISTER_FIRST");
      const created = await client.query(
        "INSERT INTO users(name,email,google_sub,role,verified_at) VALUES ($1,$2,$3,$4,now()) RETURNING id",
        [
          typeof payload.name === "string"
            ? payload.name.slice(0, 100)
            : "Pinna member",
          email,
          payload.sub,
          flow.account_type,
        ],
      );
      return created.rows[0].id;
    });
    await newSession(userId);
    const user = (await getSession())!;
    return NextResponse.redirect(new URL(nextPath(user), appOrigin()));
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "USE_EXISTING_SIGN_IN"
        ? "existing-account"
        : error instanceof Error && error.message === "REGISTER_FIRST"
          ? "register-first"
          : "google-failed";
    return NextResponse.redirect(
      new URL(`/sign-in?error=${reason}`, appOrigin()),
    );
  }
}
