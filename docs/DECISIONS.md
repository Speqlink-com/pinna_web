# Shared Pinnaa experience · 21 November 2026

The current owner brief supersedes the previous corporate attribution: all application screens, public metadata and outgoing account mail use Pinnaa. The three-loop emblem and favicon come from BT's approved exports; the wordmark reads `pinnaa`. BT's About, Services, For providers, Guidance and Contact navigation is adapted to the features available in this application. Public links resolve to the new One Health information page, existing help/privacy pages or account flows. Provider registration links preselect the business account purpose. No sample contact details or unsupported BT workflows are presented as live services.

The shared `.pinnaa-workspace` theme now applies to customer, provider, Admin and Super Admin screens. `app/system.css` owns the fixed viewport shells, white surfaces, shadows, stronger type and role-independent controls. The document remains fixed while forms, navigation, public content and workspace content scroll independently. Conversations retain separate list/history scrolling and a visible composer. Mobile menus use disclosure controls with Escape, outside-click dismissal and focus restoration. Admin overview metrics come from the existing dashboard response; application links preserve the requested location/status filter.

Authentication, authorization and publication policies are unchanged. Backend changes replace the email signature/sender display name, including the Compose override needed when an older operator environment still supplies the former display name.

---

# Premium artwork and contrast · 21 November 2026

The supplied public icon assets now appear in provider navigation, search, messages, settings, registration, business cards and location controls. The notification bell opens a keyboard-accessible panel with current business registration/approval statuses and links to the matching location. It does not imply unread events or introduce a notification delivery service. Selected map locations use the supplied location pin while retaining dragging and coordinate selection.

Secondary text, semantic status labels, borders and dashboard surfaces use stronger colors. The shared muted-text and border tokens are also darker. Original artwork colors/transparency and the user's updated authentication button images are preserved; accessible names remain on controls, with artwork treated as decorative.

---

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
