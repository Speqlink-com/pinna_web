# Phase-one decisions · 9 November 2026

- Latest owner brief controls visible naming: **Pinna**, a product of **Bismart Inc.** Prior BT naming changes are historical context.
- Next.js 16 is retained from the supplied `pinna_web` starter. Versioned handlers use PostgreSQL rather than embedding identity state in the browser.
- BT is a product / architecture reference, not a runtime dependency. Its PGlite schema, legacy roles, and demo seeds are not reused. Existing-account migration remains an explicit future decision.
- Public account purpose is personal or business. Provider category belongs to a portfolio. Neither request body nor a login selector can assign an administrative role.
- A business account owns many portfolios. Staff memberships, delegated permissions, and switching between delegated organizations remain future work; no claim is made that this phase implements them.
- Business onboarding currently saves category-aware portfolio drafts. Private evidence collection and approval mutations are deferred. All public discovery enforces `APPROVED`, and this application exposes no approval shortcut.
- Admin password invitation delivery follows the requested temporary-password model, adding expiration, mandatory replacement, and mandatory TOTP. Secrets are encrypted in the durable outbox and never returned to the inviter.
- Preview routes are visibly synthetic, read no real users, and have no API privilege. Disabled by default in production.
- No location is inferred. Device location is foreground opt-in; manual county filtering remains available. No user coordinates are persisted.
- Exact insurance product IDs, private verification operations, retention periods, support contacts, BT migration, and provider-coordinate verification remain open. They are not silently treated as completed requirements.
