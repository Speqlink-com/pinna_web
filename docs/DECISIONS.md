# Welcome and provider design · 21 November 2026

The welcome/sign-in and provider workspace use BT's One Health positioning and teal/navy/coral palette with the Inter typography and Lucide icon system shared by the Bizlead reference. BT was pulled with `--ff-only`; existing local BT changes remain intact. The healthcare campus illustration is copied from BT and presented as an illustration, not a photograph of a listed provider. Existing user button artwork remains replaceable at the same public asset paths.

The provider workspace has a full-width content area, collapsible desktop navigation and a mobile drawer. Its overview derives metrics, next steps and conversations from the authenticated dashboard response. Business, verification and operating-control links open the exact location in the existing editor; header search opens the filtered business list. The empty state offers registration without fabricated activity, revenue, ratings or trends. The provider theme is scoped with `.provider-workspace`; customer/admin dashboards retain their previous designs. `app/premium.css` contains the palette and scoped presentation rules.

No backend authorization, publication, stock or authentication policy changes are included. The email OTP form regression remains covered by the interactive Admin and Super Admin tests.

---

# Identity authority update · 2026-11-13

`pinna_infra` is now the sole routed identity/workspace authority. The Vercel app proxies versioned requests and carries opaque backend sessions in HttpOnly cookies. Public account type choices remain USER/BUSINESS; administrative roles are assigned by private seeding or owner invitation. Every business/admin/owner requires TOTP, and business workspace access also requires administrative account approval. Customers do not require MFA.

The earlier Node auth/schema/mail files below describe the initial prototype and are retained only as migration references. Their endpoints are no longer dispatched, and their operational npm scripts were removed. Do not mix their scrypt/AES formats or database schema with the new Argon2id/Fernet/HMAC backend. See `pinna_infra/docs/IDENTITY.md` and `DEPLOYMENT.md` for current contracts and deployment.

---

# Phase-one decisions · 9 November 2026

- Latest owner brief controls visible naming: **pinnaa**, a product of **Bismart Inc.** Prior BT naming changes are historical context.
- Next.js 16 is retained from the supplied `pinna_web` starter. Versioned handlers use PostgreSQL rather than embedding identity state in the browser.
- BT is a product / architecture reference, not a runtime dependency. Its PGlite schema, legacy roles, and demo seeds are not reused. Existing-account migration remains an explicit future decision.
- Public account purpose is personal or business. Provider category belongs to a portfolio. Neither request body nor a login selector can assign an administrative role.
- A business account owns many portfolios. Staff memberships, delegated permissions, and switching between delegated organizations remain future work; no claim is made that this phase implements them.
- Business onboarding currently saves category-aware portfolio drafts. Private evidence collection and approval mutations are deferred. All public discovery enforces `APPROVED`, and this application exposes no approval shortcut.
- Admin password invitation delivery follows the requested temporary-password model, adding expiration, mandatory replacement, and mandatory TOTP. Secrets are encrypted in the durable outbox and never returned to the inviter.
- Preview routes are visibly synthetic, read no real users, and have no API privilege. Disabled by default in production.
- No location is inferred. Device location is foreground opt-in; manual county filtering remains available. No user coordinates are persisted.
- Exact insurance product IDs, private verification operations, retention periods, support contacts, BT migration, and provider-coordinate verification remain open. They are not silently treated as completed requirements.
