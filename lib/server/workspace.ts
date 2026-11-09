import { searchProviders } from "./discovery";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { db, transaction } from "./db";
import {
  json,
  requireUser,
  requireRole,
  Problem,
  audit,
  rateLimit,
} from "./security";
import type { User } from "../types";
import { portfolioSchema, emailSchema } from "../validation";
import { encrypt, token, hashPassword } from "./crypto";
import { requireMail } from "./mail";
export async function workspaceGet(path: string, request: NextRequest) {
  return getWorkspace(path, request, await requireUser());
}
export async function getWorkspace(
  path: string,
  request: NextRequest,
  user: User,
) {
  if (path === "dashboard") {
    const admin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    const portfolios = admin
      ? (
          await db().query(
            "SELECT * FROM portfolios ORDER BY created_at DESC LIMIT 100",
          )
        ).rows
      : (
          await db().query(
            "SELECT * FROM portfolios WHERE owner_id=$1 ORDER BY created_at DESC",
            [user.id],
          )
        ).rows;
    const conversations = (
      await db().query(
        `SELECT c.id,c.portfolio_id,p.name AS provider_name,u.name AS customer_name,c.updated_at,(SELECT body FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message FROM conversations c JOIN portfolios p ON p.id=c.portfolio_id JOIN users u ON u.id=c.customer_id WHERE ${user.role === "BUSINESS" ? "p.owner_id=$1" : "c.customer_id=$1"} ORDER BY c.updated_at DESC LIMIT 50`,
        [user.id],
      )
    ).rows;
    const admins =
      user.role === "SUPER_ADMIN"
        ? (
            await db().query(
              "SELECT id,name,email,created_at,must_change_password FROM users WHERE role='ADMIN' ORDER BY created_at DESC",
            )
          ).rows
        : [];
    const savedCount = (
      await db().query(
        "SELECT count(*)::int AS count FROM saved_providers WHERE user_id=$1",
        [user.id],
      )
    ).rows[0].count;
    const stats = admin
      ? [
          {
            label: "Portfolio applications",
            value: portfolios.length,
            detail: "Latest 100 applications",
          },
          {
            label: "Awaiting review",
            value: portfolios.filter((p) => p.status === "SUBMITTED").length,
            detail: "Submitted for initial review",
          },
          {
            label: "Awaiting approval",
            value: portfolios.filter((p) => p.status === "ADMIN_RECOMMENDED")
              .length,
            detail: "Super Admin decision required",
          },
          {
            label: "Published portfolios",
            value: portfolios.filter((p) => p.status === "APPROVED").length,
            detail: "Approved in this queue",
          },
        ]
      : user.role === "BUSINESS"
        ? [
            {
              label: "Your portfolios",
              value: portfolios.length,
              detail: "Across all service categories",
            },
            {
              label: "Published",
              value: portfolios.filter((p) => p.status === "APPROVED").length,
              detail: "Visible in discovery",
            },
            {
              label: "Conversations",
              value: conversations.length,
              detail: "Customer connections",
            },
            {
              label: "In progress",
              value: portfolios.filter((p) => p.status !== "APPROVED").length,
              detail: "Complete your portfolio setup",
            },
          ]
        : [
            {
              label: "Saved providers",
              value: savedCount,
              detail: "Your shortlist, in one place",
            },
            {
              label: "Conversations",
              value: conversations.length,
              detail: "Connect directly with providers",
            },
          ];
    return json({ portfolios, conversations, admins, stats });
  }
  if (path === "providers")
    return json({
      providers: await searchProviders(request.nextUrl.searchParams),
    });
  if (path === "saved")
    return json({
      providers: (
        await db().query(
          "SELECT p.id,p.name,p.category,p.county,p.address,p.phone,p.status,p.insurance,p.services,p.created_at,NULL::float AS distance FROM portfolios p JOIN saved_providers s ON s.portfolio_id=p.id WHERE s.user_id=$1 AND p.status='APPROVED'",
          [user.id],
        )
      ).rows,
    });
  const conversationMatch = path.match(/^conversations\/([a-f0-9-]{36})$/);
  if (conversationMatch) {
    await conversationAccess(conversationMatch[1], user.id);
    return json({
      messages: (
        await db().query(
          "SELECT id,sender_id,body,created_at FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC LIMIT 200",
          [conversationMatch[1]],
        )
      ).rows,
    });
  }
  throw new Problem(404, "This endpoint does not exist.");
}
async function conversationAccess(id: string, userId: string) {
  const result = await db().query(
    "SELECT c.id FROM conversations c JOIN portfolios p ON p.id=c.portfolio_id WHERE c.id=$1 AND (c.customer_id=$2 OR p.owner_id=$2)",
    [id, userId],
  );
  if (!result.rowCount)
    throw new Problem(404, "This conversation is unavailable.");
}
export async function workspacePost(path: string, body: unknown) {
  return postWorkspace(path, body, await requireUser());
}
export async function postWorkspace(path: string, body: unknown, user: User) {
  if (path === "portfolios") {
    requireRole(user, ["BUSINESS"]);
    const input = portfolioSchema.parse(body);
    await rateLimit("portfolio", user.id, 20);
    const { rows } = await db().query(
      "INSERT INTO portfolios(owner_id,name,category,county,address,phone,registration_number,insurance,services) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [
        user.id,
        input.name,
        input.category,
        input.county,
        input.address,
        input.phone,
        input.registrationNumber,
        input.insurance,
        JSON.stringify(input.services),
      ],
    );
    await audit(user.id, "PORTFOLIO_CREATED", rows[0].id);
    return json(
      {
        message:
          "Portfolio saved as a draft. Verification evidence will be needed before it can be published.",
        id: rows[0].id,
      },
      201,
    );
  }
  if (path === "admins") {
    requireRole(user, ["SUPER_ADMIN"]);
    requireMail();
    const input = z
      .object({ name: z.string().trim().min(2).max(100), email: emailSchema })
      .strict()
      .parse(body);
    await rateLimit("admin-invite", user.id, 10);
    const password = `P!${token().slice(0, 20)}9aA`;
    const hashed = await hashPassword(password);
    await transaction(async (client) => {
      const result = await client.query(
        "INSERT INTO users(name,email,password_hash,role,verified_at,must_change_password,temporary_password_expires_at) VALUES ($1,$2,$3,'ADMIN',now(),true,now()+interval '24 hours') ON CONFLICT(email) DO NOTHING RETURNING id",
        [input.name, input.email, hashed],
      );
      if (!result.rowCount)
        throw new Problem(
          409,
          "An account already uses this email. Existing accounts cannot be elevated through invitations.",
        );
      await client.query(
        "INSERT INTO mail_outbox(recipient,subject,encrypted_body) VALUES ($1,'Your Pinna admin invitation',$2)",
        [
          input.email,
          encrypt(
            `You have been invited to administer Pinna by Bismart Inc.\n\nSign in at ${process.env.APP_ORIGIN}/sign-in\nEmail: ${input.email}\nTemporary password: ${password}\n\nThe temporary password expires in 24 hours. You must change this password and connect an authenticator before accessing the dashboard.`,
          ),
        ],
      );
      await client.query(
        "INSERT INTO audit_events(actor_id,action,entity_id) VALUES ($1,'ADMIN_INVITED',$2)",
        [user.id, result.rows[0].id],
      );
    });
    return json(
      {
        message:
          "Admin created. Their temporary password is queued for email delivery.",
      },
      201,
    );
  }
  if (path === "saved") {
    const { portfolioId, save } = z
      .object({ portfolioId: z.uuid(), save: z.boolean() })
      .parse(body);
    if (save) {
      const result = await db().query(
        "INSERT INTO saved_providers(user_id,portfolio_id) SELECT $1,id FROM portfolios WHERE id=$2 AND status='APPROVED' ON CONFLICT DO NOTHING RETURNING portfolio_id",
        [user.id, portfolioId],
      );
      if (!result.rowCount)
        return json({ message: "Already saved or no longer published." });
    } else
      await db().query(
        "DELETE FROM saved_providers WHERE user_id=$1 AND portfolio_id=$2",
        [user.id, portfolioId],
      );
    return json({ message: save ? "Provider saved." : "Provider removed." });
  }
  if (path === "conversations") {
    const { portfolioId } = z.object({ portfolioId: z.uuid() }).parse(body);
    await rateLimit("connect", user.id, 30);
    const result = await db().query(
      "INSERT INTO conversations(customer_id,portfolio_id) SELECT $1,id FROM portfolios WHERE id=$2 AND status='APPROVED' AND owner_id<>$1 ON CONFLICT(customer_id,portfolio_id) DO UPDATE SET updated_at=conversations.updated_at RETURNING id",
      [user.id, portfolioId],
    );
    if (!result.rowCount)
      throw new Problem(404, "This provider is unavailable.");
    return json({ id: result.rows[0].id });
  }
  const match = path.match(/^conversations\/([a-f0-9-]{36})$/);
  if (match) {
    const { message } = z
      .object({ message: z.string().trim().min(1).max(3000) })
      .parse(body);
    await rateLimit("message", user.id, 60);
    await conversationAccess(match[1], user.id);
    await transaction(async (client) => {
      await client.query(
        "INSERT INTO messages(conversation_id,sender_id,body) VALUES ($1,$2,$3)",
        [match[1], user.id, message],
      );
      await client.query(
        "UPDATE conversations SET updated_at=now() WHERE id=$1",
        [match[1]],
      );
    });
    return json({ message: "Message sent." }, 201);
  }
  throw new Problem(404, "This endpoint does not exist.");
}
