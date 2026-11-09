import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { NextRequest } from "next/server";
import {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  digest,
  totp,
  validTotp,
} from "../lib/server/crypto";
import { registerSchema } from "../lib/validation";
import { nextPath, requireRole, checkOrigin } from "../lib/server/security";
import { getWorkspace, postWorkspace } from "../lib/server/workspace";
import { authPost } from "../lib/server/auth";
import type { User } from "../lib/types";
const pg = new PGlite();
const user = (id: string, role: User["role"]): User => ({
  id,
  name: "Synthetic Test",
  email: `${id.slice(-2)}@example.test`,
  role,
  mustChangePassword: false,
  mfaRequired: false,
  mfaEnrolled: false,
});
const customer = user("00000000-0000-4000-8000-000000000001", "USER"),
  business = user("00000000-0000-4000-8000-000000000002", "BUSINESS"),
  otherBusiness = user("00000000-0000-4000-8000-000000000003", "BUSINESS"),
  admin = user("00000000-0000-4000-8000-000000000004", "ADMIN"),
  superAdmin = user("00000000-0000-4000-8000-000000000005", "SUPER_ADMIN");
const input = {
  name: "Synthetic Chemist",
  category: "Pharmacy / chemist",
  county: "Nairobi",
  address: "Test street 001",
  phone: "+254700000000",
  registrationNumber: "SYNTHETIC-001",
  insurance: ["Jubilee"],
  services: [{ name: "General consultation", price: 1000 }],
};
const req = (path: string) =>
  new NextRequest(`http://localhost:3000/api/v1/${path}`);
let portfolioId = "",
  secondPortfolio = "",
  conversationId = "";
before(async () => {
  process.env.DATABASE_URL="postgresql://isolated-test";
  process.env.AUTH_ENCRYPTION_KEY = "a".repeat(64);
  process.env.APP_ORIGIN = "http://localhost:3000";
  process.env.SMTP_HOST = "smtp.example.test";
  process.env.SMTP_FROM = "Pinna <no-reply@example.test>";
  await pg.exec(
    await readFile(new URL("../scripts/schema.sql", import.meta.url), "utf8"),
  );
  const query = async (sql: string, params?: unknown[]) => {
    const result = await pg.query(sql, params);
    return {
      ...result,
      rowCount: /^\s*(SELECT|WITH)/i.test(sql)
        ? result.rows.length
        : (result.affectedRows ?? result.rows.length),
    };
  };
  (globalThis as unknown as { pinnaPool: unknown }).pinnaPool = {
    query,
    connect: async () => ({ query, release: () => {} }),
  };
  for (const actor of [customer, business, otherBusiness, admin, superAdmin])
    await pg.query(
      "INSERT INTO users(id,name,email,role,verified_at) VALUES ($1,$2,$3,$4,now())",
      [actor.id, actor.name, actor.email, actor.role],
    );
});
after(async () => {
  await pg.close();
});
test("password hashing uses a random salt and rejects incorrect passwords", async () => {
  const hash = await hashPassword("SufficientPassword12");
  const second = await hashPassword("SufficientPassword12");
  assert.notEqual(hash, second);
  assert.equal(await verifyPassword("SufficientPassword12", hash), true);
  assert.equal(await verifyPassword("WrongPassword12", hash), false);
  assert.equal(await verifyPassword("anything", "malformed"), false);
});
test("encrypted secrets authenticate ciphertext and reject tampering", () => {
  const encoded = encrypt("private test secret");
  assert.equal(decrypt(encoded), "private test secret");
  const parts = encoded.split(".");
  const raw = Buffer.from(parts[2], "base64url");
  raw[0] ^= 1;
  parts[2] = raw.toString("base64url");
  assert.throws(() => decrypt(parts.join(".")));
});
test("TOTP matches the RFC 6238 SHA-1 vector and rejects malformed input", () => {
  assert.equal(totp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 1), "287082");
  assert.equal(validTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "abc"), false);
});
test("public registration rejects admin roles and extra role payloads", () => {
  const registration = {
    name: "Synthetic User",
    email: "user@example.test",
    password: "SufficientPassword12",
    consent: true,
    accountType: "USER",
  };
  assert.equal(registerSchema.safeParse(registration).success, true);
  assert.equal(
    registerSchema.safeParse({ ...registration, role: "SUPER_ADMIN" }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...registration, accountType: "ADMIN" }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...registration, consent: false }).success,
    false,
  );
});
test("admin routing enforces password change before MFA before dashboard", () => {
  assert.equal(
    nextPath({ ...admin, mustChangePassword: true, mfaRequired: true }),
    "/change-password",
  );
  assert.equal(nextPath({ ...admin, mfaRequired: true }), "/verify-security");
  assert.equal(nextPath(admin), "/dashboard");
  assert.throws(() => requireRole(customer, ["SUPER_ADMIN"]));
});
test("mutations reject cross-origin requests", () => {
  assert.throws(() =>
    checkOrigin(
      new NextRequest("http://localhost:3000/api/v1/auth/login", {
        headers: { origin: "https://attacker.test" },
      }),
    ),
  );
  assert.doesNotThrow(() =>
    checkOrigin(
      new NextRequest("http://localhost:3000/api/v1/auth/login", {
        headers: { origin: "http://localhost:3000" },
      }),
    ),
  );
});
test("only business accounts create portfolios; one business can own many", async () => {
  await assert.rejects(() => postWorkspace("portfolios", input, customer));
  const one = await (await postWorkspace("portfolios", input, business)).json();
  const two = await (
    await postWorkspace(
      "portfolios",
      { ...input, name: "Synthetic Ambulance", category: "Ambulance service" },
      business,
    )
  ).json();
  portfolioId = one.id;
  secondPortfolio = two.id;
  assert.notEqual(portfolioId, secondPortfolio);
  const own = await (
    await getWorkspace("dashboard", req("dashboard"), business)
  ).json();
  const other = await (
    await getWorkspace("dashboard", req("dashboard"), otherBusiness)
  ).json();
  assert.equal(own.portfolios.length, 2);
  assert.equal(other.portfolios.length, 0);
  assert.equal(own.portfolios[0].status, "DRAFT");
});
test("unpublished portfolios cannot be discovered, saved, or contacted", async () => {
  const result = await (
    await getWorkspace(
      "providers",
      req("providers?insurance=Jubilee"),
      customer,
    )
  ).json();
  assert.equal(result.providers.length, 0);
  await assert.rejects(() =>
    postWorkspace("conversations", { portfolioId }, customer),
  );
  await postWorkspace("saved", { portfolioId, save: true }, customer);
  assert.equal(
    (await pg.query("SELECT * FROM saved_providers")).rows.length,
    0,
  );
});
test("insurance, service, and price are hard filters for published providers", async () => {
  // Test-only direct publication fixture. The app deliberately exposes no publication mutation yet.
  await pg.query(
    "UPDATE portfolios SET status='APPROVED',latitude=-1.28,longitude=36.8 WHERE id=$1",
    [portfolioId],
  );
  const good = await (
    await getWorkspace(
      "providers",
      req("providers?insurance=Jubilee&maxPrice=1500&q=consultation"),
      customer,
    )
  ).json();
  assert.equal(good.providers.length, 1);
  assert.equal(good.providers[0].distance, null);
  const wrong = await (
    await getWorkspace("providers", req("providers?insurance=SHA"), customer)
  ).json();
  assert.equal(wrong.providers.length, 0);
  const expensive = await (
    await getWorkspace("providers", req("providers?maxPrice=500"), customer)
  ).json();
  assert.equal(expensive.providers.length, 0);
  await assert.rejects(() =>
    getWorkspace("providers", req("providers?radius=5"), customer),
  );
  await assert.rejects(() =>
    getWorkspace("providers", req("providers?lat=999&lng=36.8"), customer),
  );
});
test("conversation reads and writes are scoped to the customer and exact portfolio owner", async () => {
  conversationId = (
    await (
      await postWorkspace("conversations", { portfolioId }, customer)
    ).json()
  ).id;
  await postWorkspace(
    `conversations/${conversationId}`,
    { message: "Synthetic enquiry" },
    customer,
  );
  const own = await (
    await getWorkspace(
      `conversations/${conversationId}`,
      req("messages"),
      business,
    )
  ).json();
  assert.equal(own.messages[0].body, "Synthetic enquiry");
  await assert.rejects(() =>
    getWorkspace(
      `conversations/${conversationId}`,
      req("messages"),
      otherBusiness,
    ),
  );
  await assert.rejects(() =>
    postWorkspace(
      `conversations/${conversationId}`,
      { message: "Unauthorized" },
      otherBusiness,
    ),
  );
  await assert.rejects(() =>
    getWorkspace(
      `conversations/${conversationId}`,
      req("messages"),
      superAdmin,
    ),
  );
});
test("only Super Admin can invite admins; passwords stay out of responses", async () => {
  await assert.rejects(() =>
    postWorkspace(
      "admins",
      { name: "Invited Admin", email: "invite@example.test" },
      admin,
    ),
  );
  const response = await (
    await postWorkspace(
      "admins",
      { name: "Invited Admin", email: "invite@example.test" },
      superAdmin,
    )
  ).json();
  assert.equal("password" in response, false);
  const account = await pg.query<{
    role: string;
    must_change_password: boolean;
  }>(
    "SELECT role,must_change_password FROM users WHERE email='invite@example.test'",
  );
  assert.equal(account.rows[0].role, "ADMIN");
  assert.equal(account.rows[0].must_change_password, true);
  const mail = await pg.query<{ encrypted_body: string }>(
    "SELECT encrypted_body FROM mail_outbox WHERE recipient='invite@example.test'",
  );
  assert.match(decrypt(mail.rows[0].encrypted_body), /Temporary password:/);
});
test("registration is atomic and verification tokens are single-use", async () => {
  const registration = {
    name: "New Synthetic User",
    email: "new@example.test",
    password: "SufficientPassword12",
    consent: true,
    accountType: "USER",
  };
  const result = await authPost(
    "auth/register",
    req("auth/register"),
    registration,
  );
  assert.equal(result.status, 201);
  const outbox = await pg.query<{ encrypted_body: string }>(
    "SELECT encrypted_body FROM mail_outbox WHERE recipient='new@example.test'",
  );
  const link = decrypt(outbox.rows[0].encrypted_body).match(
    /http:\/\/localhost:3000\/verify-email\?token=([^\s]+)/,
  );
  assert.ok(link);
  const raw = decodeURIComponent(link[1]);
  await authPost("auth/verify-email", req("auth/verify-email"), { token: raw });
  await assert.rejects(() =>
    authPost("auth/verify-email", req("auth/verify-email"), { token: raw }),
  );
  assert.equal(
    (
      await pg.query("SELECT * FROM auth_tokens WHERE token_hash=$1", [
        digest(raw),
      ])
    ).rows.length,
    0,
  );
});
test("reset revokes existing sessions and consumes all account reset tokens", async () => {
  const raw = "test-reset-token-with-sufficient-length";
  await pg.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ('synthetic-session',$1,now()+interval '1 day')",
    [customer.id],
  );
  await pg.query(
    "INSERT INTO auth_tokens(token_hash,user_id,purpose,expires_at) VALUES ($1,$2,'reset',now()+interval '30 minutes')",
    [digest(raw), customer.id],
  );
  await authPost("auth/reset-password", req("reset"), {
    token: raw,
    password: "FreshStrongPassword12",
  });
  assert.equal(
    (await pg.query("SELECT * FROM sessions WHERE user_id=$1", [customer.id]))
      .rows.length,
    0,
  );
  await assert.rejects(() =>
    authPost("auth/reset-password", req("reset"), {
      token: raw,
      password: "FreshStrongPassword12",
    }),
  );
});
