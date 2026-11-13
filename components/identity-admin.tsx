"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
type Client = {
  id: string;
  name: string;
  email: string;
  approval_status?: string;
  approval_note?: string;
  verified_at?: string;
  mfa_enrolled: boolean;
  disabled?: boolean;
  must_change_password?: boolean;
};
export function IdentityAdmin({
  user,
  kind = "clients",
}: {
  user: User;
  kind?: "clients" | "admins";
}) {
  const [items, setItems] = useState<Client[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState<Client | null>(null),
    [note, setNote] = useState(""),
    [offset, setOffset] = useState(0),
    [next, setNext] = useState<number | null>(null);
  async function load() {
    setLoading(true);
    try {
      const data = await api<{
        clients?: Client[];
        admins?: Client[];
        nextOffset?: number | null;
      }>(`identity/${kind}?offset=${offset}`);
      setItems(data.clients ?? data.admins ?? []);
      setNext(data.nextOffset ?? null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load accounts.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    api<{ clients?: Client[]; admins?: Client[]; nextOffset?: number | null }>(
      `identity/${kind}?offset=${offset}`,
    )
      .then((data) => {
        if (active) {
          setItems(data.clients ?? data.admins ?? []);
          setNext(data.nextOffset ?? null);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, offset]);
  async function action(path: string, body: object) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ message: string }>(path, body);
      setMessage(result.message);
      setSelected(null);
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update account.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel identity-management">
      <div className="panel-heading">
        <div>
          <h2>
            {kind === "clients"
              ? "Business account approval"
              : "Admin account access"}
          </h2>
          <p>
            {kind === "clients"
              ? "Review who may sign in as a Bismart Business client. Portfolio publication is reviewed separately."
              : "Manage issued accounts. Only the platform owner can create or disable administrators."}
          </p>
        </div>
      </div>
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
      {loading ? (
        <p role="status">Loading accounts…</p>
      ) : items.length ? (
        <div className="identity-account-list">
          {items.map((item) => (
            <article className="identity-account-row" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p>{item.email}</p>
                <p>
                  <strong>
                    {kind === "clients"
                      ? item.approval_status
                      : item.disabled
                        ? "Disabled"
                        : item.must_change_password
                          ? "Password change required"
                          : "Active"}
                  </strong>{" "}
                  ·{" "}
                  {kind === "clients"
                    ? item.verified_at
                      ? "Email verified"
                      : "Email not verified"
                    : "Admin"}{" "}
                  · {item.mfa_enrolled ? "MFA enrolled" : "MFA setup pending"}
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  setSelected(item);
                  setNote("");
                  setError("");
                }}
              >
                Manage access
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p>No accounts to review.</p>
      )}
      <div className="identity-actions">
        {offset > 0 && (
          <button
            className="button secondary"
            onClick={() => {
              setLoading(true);
              setOffset(Math.max(0, offset - 50));
            }}
          >
            Previous
          </button>
        )}
        {next !== null && (
          <button
            className="button secondary"
            onClick={() => {
              setLoading(true);
              setOffset(next);
            }}
          >
            Next
          </button>
        )}
      </div>
      {selected && (
        <div className="identity-review-form">
          <h3>Review {selected.name}</h3>
          {selected.approval_note && (
            <p>Latest note: {selected.approval_note}</p>
          )}
          <label htmlFor="review-note">Decision or recovery rationale</label>
          <textarea
            id="review-note"
            minLength={10}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Record the evidence reviewed and the reason for this action."
          />
          <p>
            Access changes sign out existing sessions. Reset MFA only after
            independently verifying the account owner’s identity.
          </p>
          <div className="identity-actions">
            {kind === "clients" &&
              ["APPROVED", "REJECTED", "SUSPENDED", "PENDING"]
                .filter((d) => d !== selected.approval_status)
                .map((decision) => (
                  <button
                    className="button secondary"
                    key={decision}
                    disabled={
                      busy ||
                      note.trim().length < 10 ||
                      (decision === "APPROVED" && !selected.verified_at)
                    }
                    onClick={() =>
                      action(`identity/clients/${selected.id}/decision`, {
                        decision,
                        note,
                      })
                    }
                  >
                    {decision === "APPROVED"
                      ? "Approve sign-in"
                      : decision === "REJECTED"
                        ? "Reject"
                        : decision === "SUSPENDED"
                          ? "Suspend"
                          : "Return to review"}
                  </button>
                ))}
            {user.role === "SUPER_ADMIN" && (
              <>
                <button
                  className="button secondary"
                  disabled={busy || note.trim().length < 10}
                  onClick={() =>
                    action(`identity/users/${selected.id}/status`, {
                      disabled: !selected.disabled,
                      reason: note,
                    })
                  }
                >
                  {selected.disabled ? "Enable account" : "Disable account"}
                </button>
                {selected.mfa_enrolled && (
                  <button
                    className="button secondary"
                    disabled={busy || note.trim().length < 10}
                    onClick={() =>
                      action(`identity/users/${selected.id}/reset-mfa`, {
                        reason: note,
                      })
                    }
                  >
                    Reset authenticator
                  </button>
                )}
              </>
            )}
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setSelected(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
