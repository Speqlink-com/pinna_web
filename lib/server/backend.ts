/** Server-only API bridge. Browser credentials stay in host-only HttpOnly cookies. */
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@/lib/types";

const sessionName =
  process.env.NODE_ENV === "production"
    ? "__Host-pinna_session"
    : "pinna_session";
const oauthName =
  process.env.NODE_ENV === "production" ? "__Host-pinna_oauth" : "pinna_oauth";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function backendFetch(
  path: string,
  options: {
    method?: string;
    body?: string;
    session?: string;
    oauth?: string;
    query?: string;
  } = {},
) {
  const configured = process.env.PINNA_API_URL;
  const key = process.env.PINNA_WEB_PROXY_KEY;
  if (!configured || !key || key.length < 32)
    throw new Error("BackendConfigurationError");
  const origin = new URL(configured);
  if (
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password ||
    (process.env.NODE_ENV === "production" && origin.protocol !== "https:") ||
    !["http:", "https:"].includes(origin.protocol)
  )
    throw new Error("BackendConfigurationError");
  if (!/^[a-zA-Z0-9_/-]+$/.test(path) || path.includes(".."))
    throw new Error("InvalidBackendPath");
  return fetch(`${origin.origin}/api/v1/${path}${options.query ?? ""}`, {
    method: options.method ?? "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
    headers: {
      "X-Pinna-Proxy-Key": key,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.session
        ? { Authorization: `Bearer ${options.session}` }
        : {}),
      ...(options.oauth ? { "X-Pinna-OAuth-State": options.oauth } : {}),
    },
    body: options.body,
  });
}

export async function backendSession(): Promise<User | null> {
  const raw = (await cookies()).get(sessionName)?.value;
  if (!raw) return null;
  const response = await backendFetch("auth/session", { session: raw });
  if (!response.ok) throw new Error("IdentityServiceUnavailable");
  return (await response.json()).user as User | null;
}

export async function proxyBackend(
  request: NextRequest,
  path: string,
  body?: string,
) {
  const response = await backendFetch(path, {
    method: request.method,
    body: request.method === "GET" ? undefined : body,
    session: request.cookies.get(sessionName)?.value,
    oauth: request.cookies.get(oauthName)?.value,
    query: request.nextUrl.search,
  });
  const data = await response.json();
  const {
    sessionToken,
    sessionMaxAge,
    clearSession,
    oauthState,
    clearOAuth,
    authorizationUrl,
    ...publicData
  } = data;
  if (clearSession && !publicData.redirect) publicData.redirect = "/sign-in";
  let result: NextResponse;
  if (
    response.ok &&
    request.method === "GET" &&
    path.startsWith("auth/google/")
  ) {
    if (authorizationUrl) {
      const destination = new URL(authorizationUrl);
      if (destination.origin !== "https://accounts.google.com")
        throw new Error("InvalidOAuthRedirect");
      result = NextResponse.redirect(destination, 302);
    } else {
      const redirect = publicData.redirect;
      if (
        typeof redirect !== "string" ||
        !redirect.startsWith("/") ||
        redirect.startsWith("//") ||
        redirect.includes("\\")
      )
        throw new Error("InvalidOAuthRedirect");
      result = NextResponse.redirect(
        new URL(redirect, process.env.APP_ORIGIN),
        302,
      );
    }
  } else result = NextResponse.json(publicData, { status: response.status });
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("Referrer-Policy", "no-referrer");
  if (
    response.ok &&
    typeof sessionToken === "string" &&
    /^[A-Za-z0-9_-]{40,100}$/.test(sessionToken) &&
    Number.isInteger(sessionMaxAge) &&
    sessionMaxAge > 0 &&
    sessionMaxAge <= 7 * 86400
  )
    result.cookies.set(sessionName, sessionToken, {
      ...cookieOptions,
      maxAge: sessionMaxAge,
    });
  if (clearSession)
    result.cookies.set(sessionName, "", { ...cookieOptions, maxAge: 0 });
  if (
    typeof oauthState === "string" &&
    /^[A-Za-z0-9_-]{40,100}$/.test(oauthState)
  )
    result.cookies.set(oauthName, oauthState, {
      ...cookieOptions,
      maxAge: 600,
    });
  if (clearOAuth)
    result.cookies.set(oauthName, "", { ...cookieOptions, maxAge: 0 });
  return result;
}
