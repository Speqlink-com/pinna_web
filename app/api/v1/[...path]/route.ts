import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { authPost } from "@/lib/server/auth";
import { googleStart, googleCallback } from "@/lib/server/google";
import { workspaceGet, workspacePost } from "@/lib/server/workspace";
import { checkOrigin, getSession, json, Problem } from "@/lib/server/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: NextRequest, context: Context) {
  try {
    const path = (await context.params).path.join("/");
    if (request.method === "GET") {
      if (path === "auth/google/start") return await googleStart(request);
      if (path === "auth/google/callback") return await googleCallback(request);
      if (path === "auth/session") return json({ user: await getSession() });
      return await workspaceGet(path, request);
    }
    checkOrigin(request);
    if (Number(request.headers.get("content-length") ?? 0) > 32768)
      throw new Problem(413, "This request is too large.");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new Problem(415, "Send a JSON request.");
    const raw = await request.text();
    if (raw.length > 32768)
      throw new Problem(413, "This request is too large.");
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Problem(400, "This request could not be read.");
    }
    return path.startsWith("auth/")
      ? await authPost(path, request, body)
      : await workspacePost(path, body);
  } catch (error) {
    if (error instanceof Problem)
      return json({ error: error.message }, error.status);
    if (error instanceof ZodError)
      return json(
        {
          error:
            error.issues[0]?.message ?? "Check your entries and try again.",
        },
        400,
      );
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    )
      return json(
        {
          error:
            "This record already exists. Sign in or use a different email.",
        },
        409,
      );
    // Do not log request bodies, credentials, OAuth codes, or database error details.
    console.error(
      "Pinna request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      {
        error:
          "The service is temporarily unavailable. Please try again shortly.",
      },
      503,
    );
  }
}
export const GET = handle;
export const POST = handle;
