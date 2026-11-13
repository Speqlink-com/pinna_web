"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
type Session = {
  id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  current: boolean;
};
export function IdentitySecurity({ user }: { user: User }) {
  const [sessions, setSessions] = useState<Session[]>([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [codes, setCodes] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    api<{ sessions: Session[] }>("auth/sessions")
      .then((data) => {
        if (active) setSessions(data.sessions);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function request(path: string, body: object) {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await api<{
        message?: string;
        redirect?: string;
        recoveryCodes?: string[];
        clearSession?: boolean;
      }>(path, body);
      if (result.redirect) window.location.assign(result.redirect);
      else if (result.clearSession) window.location.assign("/sign-in");
      else {
        setMessage(result.message ?? "Security settings updated.");
        if (result.recoveryCodes) setCodes(result.recoveryCodes);
        const data = await api<{ sessions: Session[] }>("auth/sessions");
        setSessions(data.sessions);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update account.");
    } finally {
      setBusy(false);
    }
  }
  function form(e: FormEvent<HTMLFormElement>, path: string) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    if (
      body.confirmation !== undefined &&
      body.password !== body.confirmation
    ) {
      setError("Your passwords do not match.");
      return;
    }
    delete body.confirmation;
    void request(path, body);
  }
  return (
    <div className="identity-security-grid">
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <section className="panel identity-security-panel">
        <h2>Profile</h2>
        <form onSubmit={(e) => form(e, "auth/profile")}>
          <label htmlFor="profile-name">Full name</label>
          <input
            id="profile-name"
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={user.name}
          />
          <button className="button secondary" disabled={busy}>
            Save name
          </button>
        </form>
        <button
          type="button"
          disabled={user.googleConnected}
          onClick={() =>
            window.location.assign("/api/v1/auth/google/link/start")
          }
          className="button secondary"
        >
          {user.googleConnected
            ? "Google account connected"
            : "Connect your Google account"}
        </button>
        <p>
          Use a Google account with the same email address. Business and admin
          MFA requirements still apply.
        </p>
      </section>
      {user.hasPassword !== false && (
        <section className="panel identity-security-panel">
          <h2>Change password</h2>
          <form onSubmit={(e) => form(e, "auth/change-password")}>
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
            <p>
              Use at least 12 characters, upper and lowercase letters, and a
              number. Changing your password signs out all sessions.
            </p>
            <button className="button secondary" disabled={busy}>
              Change password
            </button>
          </form>
        </section>
      )}
      {user.mfaEnrolled && (
        <section className="panel identity-security-panel">
          <h2>Recovery codes</h2>
          <p>
            Replace your recovery codes if they have been used or exposed.
            Previous codes will stop working. Sign in again if your security
            confirmation has expired.
          </p>
          <form onSubmit={(e) => form(e, "auth/mfa/recovery-codes")}>
            <label htmlFor="recovery-confirmation">
              Authenticator or unused recovery code
            </label>
            <input
              id="recovery-confirmation"
              name="code"
              autoComplete="one-time-code"
              required
              minLength={6}
              maxLength={80}
            />
            <button className="button secondary" disabled={busy}>
              Replace recovery codes
            </button>
          </form>
          {codes.length > 0 && (
            <div>
              <h3>Save these codes now</h3>
              <div className="recovery-grid">
                {codes.map((code) => (
                  <code key={code}>{code}</code>
                ))}
              </div>
              <button
                className="button secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(codes.join("\n"));
                    setMessage(
                      "Recovery codes copied. Store them somewhere private.",
                    );
                  } catch {
                    setError("Select and copy the codes manually.");
                  }
                }}
              >
                Copy codes
              </button>
            </div>
          )}
        </section>
      )}
      <section className="panel identity-security-panel">
        <h2>Active sessions</h2>
        <p>
          Business and admin sessions expire after 30 minutes of inactivity,
          with a 12-hour maximum.
        </p>
        {sessions.map((session) => (
          <div className="identity-session" key={session.id}>
            <div>
              <strong>
                {session.current ? "This session" : "Other session"}
              </strong>
              <p>Signed in {new Date(session.created_at).toLocaleString()}</p>
            </div>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                request("auth/sessions/revoke", { sessionId: session.id })
              }
            >
              Sign out
            </button>
          </div>
        ))}
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => request("auth/logout-all", {})}
        >
          Sign out all sessions
        </button>
      </section>
    </div>
  );
}
