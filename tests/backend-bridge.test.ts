import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxyBackend } from "../lib/server/backend";

const originalFetch = globalThis.fetch;
let lifetime = 30 * 86400;
before(() => {
  process.env.PINNA_API_URL = "http://localhost:8019";
  process.env.PINNA_WEB_PROXY_KEY = "proxy-test-key-".repeat(4);
  globalThis.fetch = async () =>
    Response.json({
      sessionToken: "a".repeat(48),
      sessionMaxAge: lifetime,
      user: { id: "synthetic" },
      redirect: "/dashboard",
    });
});
after(() => {
  globalThis.fetch = originalFetch;
});

test("backend bridge persists the full 30-day member session without exposing credentials", async () => {
  const request = new NextRequest("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
  });
  const response = await proxyBackend(request, "auth/login", "{}");
  assert.match(response.headers.get("set-cookie") ?? "", /Max-Age=2592000/);
  assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/);
  assert.match(response.headers.get("set-cookie") ?? "", /SameSite=lax/i);
  const data = await response.json();
  assert.equal(data.sessionToken, undefined);
  assert.equal(data.sessionMaxAge, undefined);
  assert.equal(data.user.id, "synthetic");
});

test("backend bridge refuses session cookies beyond the configured maximum policy", async () => {
  lifetime = 91 * 86400;
  const response = await proxyBackend(
    new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
    }),
    "auth/login",
    "{}",
  );
  assert.equal(response.headers.get("set-cookie"), null);
});
