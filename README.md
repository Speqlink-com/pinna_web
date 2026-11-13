# Pinna web · Bismart Inc.

Next.js 16 / React 19 web app in black, grey and white, deployed to **https://pinnaa.com** on Vercel. Identity and workspace data come from the Python/PostgreSQL backend in `../pinna_infra`, exposed at **https://api.pinnaa.com**.

## Run

```sh
pnpm install
cp .env.example .env.local
# Set APP_ORIGIN, PINNA_API_URL and matching PINNA_WEB_PROXY_KEY.
pnpm dev
```

For local development use `APP_ORIGIN=http://localhost:3000` and `PINNA_API_URL=http://127.0.0.1:8000`. The proxy key must equal the backend `WEB_PROXY_KEY`. Production requires HTTPS. In Vercel set these three **server-only** variables; do not prefix secrets with `NEXT_PUBLIC_`. The browser sends same-origin requests; host-only HttpOnly cookies carry sessions. The server bridge strips session tokens and OAuth state from browser JSON. Google, Zoho, database migration and owner seeding are configured in the backend, not Vercel.

The Python backend is the only routed identity authority, in development and production. The earlier Node database/auth files and PGlite tests remain as historical migration references; they are not routed. Do not run the earlier database/mail/seed scripts against the new backend database. Legacy real users require an explicit migration because password hashes, encrypted MFA data and token digests use different formats. See [backend deployment guide](../pinna_infra/docs/DEPLOYMENT.md).

## Account behavior

- Customers register for themselves, verify email and go to discovery without MFA.
- Bismart Business clients register once for multiple portfolios. Email verification, Admin approval and authenticator MFA are required before workspace access. Pending/rejected/suspended users see `/account-status`.
- Admins are created only by the seeded Super Admin. Invitations email a 24-hour temporary password, followed by forced replacement and MFA enrollment.
- The backend seeds `comsiwende@gmail.com` from its private environment password. Seeding never overwrites an existing account. The owner also changes the initial password and enrolls MFA.

`/sign-in`, `/sign-up`, password recovery, email verification, `/change-password` and `/verify-security` connect to real backend endpoints. Google uses a configured web OAuth client with callback `https://pinnaa.com/api/v1/auth/google/callback`; existing password accounts connect Google explicitly from account settings. Google does not bypass business approval or MFA.

Admins review business sign-in requests in `/dashboard/clients`. The owner manages invited admin access and client recovery, with reasons and audit events. Account settings expose name update, password change, explicit Google connection, own session revocation and recovery-code replacement. No sign-in role selector or public admin signup exists.

Business account approval does not publish portfolios. New portfolios stay private drafts. Provider evidence submission, category verification and publication remain a separate phase. Discovery, saving and owner/customer chats use backend ownership checks; admins cannot read private chats. Medicine catalogues, dispatch, clinical records and payments are outside this identity scope.

## Design previews and artwork

`/preview/customer`, `/preview/business` and `/preview/admin` show explicitly labelled synthetic data. They do not create accounts or send emails/messages. Production previews remain disabled unless `ENABLE_DESIGN_PREVIEWS=true`.

Supplied PNG buttons and WebP icons retain their filenames in `public/`. See [artwork guide](public/images/auth/README.md). Local Inter fonts include their OFL license. The new `public/pinna-logo.png` is user artwork and remains untouched by this identity work.

## Validation

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Backend integration/security tests and the production TLS/container smoke test live in `../pinna_infra`. Real Google/Zoho delivery and Vercel/Cloudflare acceptance require the operator's completed environment and infrastructure. The privacy/terms pages still need final Bismart policy and support details before public provider onboarding.
