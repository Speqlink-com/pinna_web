import type { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/server/backend";
import { checkOrigin, json, Problem } from "@/lib/server/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: NextRequest, context: Context) {
  try {
    const path = (await context.params).path.join("/");
    if (
      request.method === "GET" &&
      path.includes("google/") &&
      request.headers.get("sec-fetch-site") === "cross-site" &&
      !path.endsWith("callback")
    )
      throw new Problem(403, "Open sign-in from Pinna to continue.");
    let body: string | Uint8Array | undefined;
    if (request.method !== "GET") {
      checkOrigin(request);
      const upload = /^portfolios\/[a-f0-9-]{36}\/documents\/upload$/i.test(
        path,
      );
      const maximum = upload ? 3 * 1024 * 1024 : 32768;
      if (upload && !request.headers.get("x-pinna-evidence"))
        throw new Problem(400, "Add the document details.");
      if ((request.headers.get("x-pinna-evidence")?.length ?? 0) > 4096)
        throw new Problem(413, "Document details are too large.");
      if (
        !request.headers
          .get("content-type")
          ?.startsWith(upload ? "application/octet-stream" : "application/json")
      )
        throw new Problem(415, "Use the supported request content type.");
      if (Number(request.headers.get("content-length") ?? 0) > maximum)
        throw new Problem(413, "This request is too large.");
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.length;
          if (size > maximum) {
            await reader.cancel();
            throw new Problem(413, "This request is too large.");
          }
          chunks.push(chunk.value);
        }
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      body = upload ? bytes : new TextDecoder().decode(bytes);
    }
    return await proxyBackend(request, path, body);
  } catch (error) {
    if (error instanceof Problem)
      return json({ error: error.message }, error.status);
    console.error(
      "Pinna API bridge failed",
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
