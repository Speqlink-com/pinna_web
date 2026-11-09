CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text UNIQUE NOT NULL,
 password_hash text, google_sub text UNIQUE, role text NOT NULL CHECK(role IN ('USER','BUSINESS','ADMIN','SUPER_ADMIN')),
 verified_at timestamptz, must_change_password boolean NOT NULL DEFAULT false, disabled boolean NOT NULL DEFAULT false,
 temporary_password_expires_at timestamptz, mfa_secret text, mfa_pending text, mfa_last_step bigint, recovery_hashes text[] NOT NULL DEFAULT '{}',
 consent_version text NOT NULL DEFAULT '2026-11-09', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, mfa_verified boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS auth_tokens (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, purpose text NOT NULL CHECK(purpose IN ('verify','reset')), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, attempts int NOT NULL, reset_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS oauth_states (state_hash text PRIMARY KEY, nonce text NOT NULL, verifier text NOT NULL, account_type text NOT NULL CHECK(account_type IN ('USER','BUSINESS')), intent text NOT NULL CHECK(intent IN ('login','register')), expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS portfolios (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id), name text NOT NULL,
 category text NOT NULL, county text NOT NULL, address text NOT NULL, phone text NOT NULL,
 registration_number text NOT NULL, status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SUBMITTED','ADMIN_RECOMMENDED','APPROVED','CHANGES_REQUESTED')),
 insurance text[] NOT NULL DEFAULT '{}', services jsonb NOT NULL DEFAULT '[]', latitude double precision, longitude double precision,
 reviewed_by uuid REFERENCES users(id), review_note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolios_owner_idx ON portfolios(owner_id);
CREATE INDEX IF NOT EXISTS portfolios_status_idx ON portfolios(status);
CREATE TABLE IF NOT EXISTS conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES users(id), portfolio_id uuid NOT NULL REFERENCES portfolios(id), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(customer_id,portfolio_id));
CREATE TABLE IF NOT EXISTS messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES conversations(id), sender_id uuid NOT NULL REFERENCES users(id), body text NOT NULL CHECK(length(body) BETWEEN 1 AND 3000), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id,created_at);
CREATE TABLE IF NOT EXISTS saved_providers (user_id uuid NOT NULL REFERENCES users(id), portfolio_id uuid NOT NULL REFERENCES portfolios(id), PRIMARY KEY(user_id,portfolio_id));
CREATE TABLE IF NOT EXISTS audit_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_id uuid REFERENCES users(id), action text NOT NULL, entity_id text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS mail_outbox (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, recipient text NOT NULL, subject text NOT NULL, encrypted_body text NOT NULL, attempts int NOT NULL DEFAULT 0, sent_at timestamptz, next_attempt_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now());
