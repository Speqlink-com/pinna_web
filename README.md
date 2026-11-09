# Pinna web · Bismart Inc.

A fresh Next.js 16 / React 19 application in a black, grey, and white design system. Product context comes from `../BT`; auth artwork follows the optional image-button pattern in RAV. BT and `pinna_infra` are unchanged.

## Run locally

Requires Node.js 24, pnpm, and PostgreSQL 16 or later for real accounts.

```sh
pnpm install
cp .env.example .env.local
# Fill in private configuration, then:
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Run `pnpm mail:worker` in a second terminal to deliver account emails. SMTP delivery is asynchronous and retries failures. No emails are sent just by viewing or using the design previews.

`APP_ORIGIN` must exactly match the browser origin, including port. If you open `http://127.0.0.1:3000`, configure that exact origin instead of `http://localhost:3000`.

### Inspect the UI without credentials

```sh
pnpm dev
```

- `/sign-in` and `/sign-up`: public auth screens.
- `/forgot-password`, `/reset-password`, `/verify-email`: account recovery and verification.
- `/preview/customer`: synthetic customer discovery dashboard.
- `/preview/business`: synthetic business dashboard and portfolio draft form.
- `/preview/admin`: synthetic Super Admin dashboard and team UI.

Previews are explicitly labelled. They never grant real access, contact providers, send messages, or create admins. Production previews are disabled unless `ENABLE_DESIGN_PREVIEWS=true`. Actual `/dashboard` routes require a database-backed session and completed security setup.

## Account behavior

- **Personal:** public registration creates `USER`; email verification precedes sign-in. Customers go directly to discovery.
- **Bismart Business:** public registration creates `BUSINESS`; one account owns multiple separate portfolios, each with its own category, contact details, insurance, services, and lifecycle. Category is selected while adding a portfolio, not while signing in.
- **Admin:** only the seeded `SUPER_ADMIN` can create `ADMIN` accounts. Admin invitations contain a random temporary password, encrypted in the email queue. It expires in 24 hours. First login requires changing it, then enrolling an authenticator. Admins never self-select a platform role.
- **Super Admin:** `pnpm db:seed` creates the initial owner from private environment variables. It never elevates or overwrites an existing email. Change the initial password and enroll MFA on first login. Remove seed credentials from the deployment environment afterwards.

## Google sign-in

Create a Google OAuth web client and configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` server-side. Register this exact callback:

```text
<APP_ORIGIN>/api/v1/auth/google/callback
```

Google uses authorization code + PKCE, a one-use database state, an HttpOnly browser state cookie, a nonce, and verified ID-token signature / issuer / audience / expiry / email checks. Signup requires the selected personal or business purpose plus consent. Existing password identities are not silently linked by matching email. Users keep their existing password sign-in.

Reference: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## Security and data

The app exposes a versioned `/api/v1` boundary with schema validation, same-origin mutation checks, account-scoped rate limits, hashed opaque session tokens, scrypt password hashes, and server-side role / portfolio ownership checks. Production cookies use `Secure`, `HttpOnly`, and a `__Host-` name. Privileged sessions require MFA; incomplete setup sessions last ten minutes and cannot access workspace APIs. MFA secrets and queued emails use AES-256-GCM. Recovery codes are hashed, one-use, and shown only at enrollment. TOTP replay protection is transactionally recorded. Password reset revokes all sessions and outstanding account tokens.

Email verification and recovery tokens are hashed in the database and consumed atomically. The transactional encrypted email outbox avoids claiming SMTP delivery before it happens. Run the worker under a process supervisor; inspect exhausted retries operationally. SMTP is at-least-once: a crash after delivery but before acknowledgement can send a duplicate with the same message ID.

Only a portfolio owner and its customer can read or write their conversation. Platform admin status does not grant access to messages. Precise search coordinates are transient and are not saved to account, audit, or portfolio records. Configure the reverse proxy to omit query strings and request bodies from access logs, particularly OAuth codes, auth tokens, and geolocation queries.

Run `pnpm maintenance` periodically to remove expired auth state and delivered email metadata. Unsent encrypted emails remain available for operator investigation. Account, message, and portfolio retention requires a Bismart policy before launch.

## Scope of this phase

Auth, access-controlled dashboard shells, owner-scoped portfolio drafts, provider discovery / saving, owner-customer messaging, and Super Admin invitations are implemented. Public discovery reads only `APPROVED` portfolios; new portfolios remain `DRAFT`. No API in this phase can approve or publish a provider. The production verification evidence workflow is deliberately gated until private evidence storage, category requirements, review transitions, expiry, and final approval are implemented. Preview providers and prices are fictional.

Medicine catalogue detail, prescription processing, appointments, dispatch, inventory, clinical records, payments, staff delegation, and subscriptions are not implemented in this phase. Ambulance entries are directory enquiries and never imply confirmed dispatch. Provider location coordinates await verified location onboarding; absent coordinates show “Distance unavailable.” Insurance matching uses exact listed plan labels; production insurers / products need a canonical plan catalogue.

This is a new independent auth/database boundary. It does not authenticate against BT or share its users. A BT migration or API integration needs an explicit migration plan. This choice avoids exposing BT’s demonstration accounts or silently reusing its legacy role model.

## Before public deployment

Configure managed PostgreSQL with verified TLS, HTTPS `APP_ORIGIN`, Google credentials, SMTP, the email worker, a securely generated 32-byte `AUTH_ENCRYPTION_KEY`, and backups of both data and encryption keys. Set proxy-level IP/automation rate limits in addition to the account limits. Configure request-size limits at the proxy, scrub access logs, supervise the worker, monitor exhausted outbox retries, and set backup / restore and incident procedures. Do not disable certificate verification for PostgreSQL.

The privacy / terms screens are marked pre-launch and require final Bismart policy, retention, and support contact details. Finish provider evidence and operational approval before publishing live providers. Live Google and SMTP delivery must be tested with the configured operator accounts; none are supplied or fabricated here.

## Artwork

Your supplied PNG buttons and WebP icons in `public/` are connected using their existing filenames. See [the asset guide](public/images/auth/README.md) for replacements. Accessible HTML fallbacks work immediately; missing images are hidden. Brand mark: `components/brand.tsx`. Theme and responsive layouts: `app/globals.css`. Optional illustrations are implemented locally as CSS and SVG, with no external asset calls.

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Tests use an isolated in-memory PostgreSQL engine (PGlite), with synthetic users only. They cover public role escalation, password hashes, authenticated encryption, TOTP reference vectors, cross-origin denial, multiple-portfolio isolation, publication gates, insurance / price / location filtering, conversation permissions, admin invitation boundaries, token consumption, and reset-session revocation. They do not replace live PostgreSQL concurrency testing, Google credentials, SMTP delivery acceptance, or an operational security review.
