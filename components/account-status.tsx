"use client";
import { useState } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { Brand } from "./brand";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
export function AccountStatus({ user }: { user: User }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = user.approvalStatus === "PENDING";
  return (
    <main className="identity-status-page">
      <Brand />
      <section className="panel identity-status-card">
        <Clock size={32} />
        <div className="eyebrow">BISMART BUSINESS</div>
        <h1>
          {pending
            ? "Your account is awaiting approval"
            : user.approvalStatus === "REJECTED"
              ? "Your application needs attention"
              : "Your business access is suspended"}
        </h1>
        <p>
          Signed in as <strong>{user.email}</strong>.
        </p>
        <p>
          {pending
            ? "A Pinna administrator will review your business account. We’ll email you when a decision is made. Once approved, you’ll connect an authenticator before entering your workspace."
            : "Review the administrator’s note below. Contact Pinna support if you need help with this decision."}
        </p>
        {user.approvalNote && (
          <div className="notice">
            <strong>Review note</strong>
            <p>{user.approvalNote}</p>
          </div>
        )}
        <p>
          <ShieldCheck size={16} /> Account approval applies to sign-in. Each
          provider portfolio has its own verification process.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="identity-actions">
          <button
            className="button primary"
            disabled={busy}
            onClick={() => window.location.reload()}
          >
            Check status
          </button>
          <button
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("auth/logout", {});
                window.location.assign("/sign-in");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Sign out failed.");
                setBusy(false);
              }
            }}
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
