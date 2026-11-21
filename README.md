# Pinnaa web

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
- Pinnaa Business clients register once for multiple portfolios. Email verification and MFA are required before workspace access. Providers register businesses and branches for separate publication approval. Administratively restricted pending/rejected/suspended users see `/account-status`.
- Admins are created only by the seeded Super Admin. Invitations email a 24-hour temporary password, followed by forced replacement and MFA enrollment.
- The backend seeds `comsiwende@gmail.com` from its private environment password. Seeding never overwrites an existing account. The owner also changes the initial password and enrolls MFA.

`/sign-in`, `/sign-up`, password recovery, email verification, `/change-password` and `/verify-security` connect to real backend endpoints. Google uses a configured web OAuth client with callback `https://pinnaa.com/api/v1/auth/google/callback`; existing password accounts connect Google explicitly from account settings. Google does not bypass business approval or MFA.

Admins manage provider account restrictions in `/dashboard/clients`. The owner manages invited admin access and client recovery, with reasons and audit events. Account settings expose name update, password change, explicit Google connection, own session revocation and recovery-code replacement. No sign-in role selector or public admin signup exists.

Business account approval does not publish portfolios. The client workspace supports a business profile and multiple portfolios with category-specific details, services and KES prices, insurance, coordinates and opening hours. Owners upload private registration and licence evidence and submit an immutable application. An Admin reviews the documents and recommends; a different Super Admin gives final publication approval. Owners can withdraw, reopen or archive listings. Expired evidence removes a listing from discovery until renewed and reviewed. The API enforces ownership, MFA, recent authentication for reviews and revision checks. Evidence is encrypted at rest and downloads remain private attachments.

Discovery, saving and owner/customer chats use backend ownership checks; admins cannot read private chats. Dispatch, clinical records, payments and automatic order-based stock deductions are outside this module. See the backend `docs/CLIENTS.md` for the evidence limits and review workflow. Set the public Mapbox token as described below.

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

Backend integration/security tests and the production TLS/container smoke test live in `../pinna_infra`. Real Google/Zoho delivery and Vercel/Cloudflare acceptance require the operator's completed environment and infrastructure. The privacy/terms pages still need final Pinnaa policy and support details before public provider onboarding.

Email signup now opens `/verify-email` for a six-digit code with a ten-minute expiry. The screen supports paste/autofill, resend cooldown, incorrect/expired feedback and existing unverified accounts. Valid password sign-in for an unverified account routes back to this step. No code is placed in a URL or browser storage. Email verification does not replace password login, business approval or privileged MFA. Previously mailed verification links remain usable until expiry.


Location maps use `mapbox-gl` with `MAPBOX_TOKEN` set to a public `pk.` token in Vercel or `.env.local`. The build validates that it is a public token and exposes it as `NEXT_PUBLIC_MAPBOX_TOKEN` for browser maps. The original `NEXT_PUBLIC_MAPBOX_TOKEN` name from `masqany-web` is also accepted for compatibility. Never use an `sk.` secret token in either setting. Public tokens should be restricted to allowed origins. Business address searches store permanent Geocoding v6 results; enable permanent geocoding on the Mapbox account. See `../pinna_infra/docs/CLIENTS.md` for the operations API, inventory semantics and rollout. Deploy backend migration `0004_location_operations` before the matching web build.

Provider onboarding is verified email → mandatory security setup → register business locations → submit evidence → Admin review → Super Admin approval. Each business location has independent map coordinates, hours, offerings, operational availability and optional inventory. Customers can search nearest/open providers and message the exact location. Customer/provider sessions default to 30 days; administrator sessions to 7 days. Administrator sign-in supports authenticator or email OTP.
