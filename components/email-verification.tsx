"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { ArrowUpRight, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import {
  clearEmailVerification,
  pendingEmailVerification,
  rememberEmailVerification,
} from "@/lib/email-verification";
import { AssetButton } from "./asset-button";

const subscribeToHydration = () => () => {};
export function EmailVerification({ token = "" }: { token?: string }) {
  const ready = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  return ready ? (
    <EmailVerificationForm token={token} />
  ) : (
    <p role="status">Loading email verification…</p>
  );
}

function EmailVerificationForm({ token }: { token: string }) {
  const [saved] = useState(pendingEmailVerification);
  const [email, setEmail] = useState(saved.email);
  const [code, setCode] = useState("");
  const [retryAt, setRetryAt] = useState(saved.retryAt);
  const [clock, setClock] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [completed, setCompleted] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!retryAt) return;
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [retryAt]);
  const remaining = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  const blocked = busy || sending;

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("auth/verify-email", token ? { token } : { email, code });
      clearEmailVerification();
      setCode("");
      setCompleted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The code could not be verified. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!emailInput.current?.reportValidity() || remaining > 0 || blocked)
      return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const result = await api<{ message: string; resendAfter: number }>(
        "auth/resend-verification",
        { email },
      );
      const now = Date.now();
      rememberEmailVerification(email, result.resendAfter);
      setRetryAt(now + result.resendAfter * 1000);
      setClock(now);
      setCode("");
      setNotice(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "A code could not be requested. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  if (completed)
    return (
      <div className="email-code-success" role="status">
        <CheckCircle2 size={32} />
        <h3>Email verified.</h3>
        <p>
          Sign in with your password to continue. Pinnaa Business accounts
          require Admin approval before workspace access.
        </p>
        <Link href="/sign-in" className="button primary full-width">
          Continue to sign in <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  return (
    <div className="email-code-verification">
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {token ? (
        <p className="email-code-help">
          You opened an existing verification link. Confirm below to verify your
          email address.
        </p>
      ) : (
        <p className="email-code-help">
          Check your inbox and spam folder for a six-digit pinnaa code. Codes
          expire after 10 minutes. Request a code below if you haven’t received
          one.
        </p>
      )}
      <form className="auth-form" onSubmit={verify} aria-busy={blocked}>
        {!token && (
          <>
            <div className="field-group">
              <label htmlFor="verification-email">Email address</label>
              <div className="input-wrap">
                <Mail size={17} />
                <input
                  ref={emailInput}
                  id="verification-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  value={email}
                  disabled={blocked}
                  placeholder="you@example.com"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setRetryAt(0);
                    setCode("");
                    setNotice("");
                  }}
                />
              </div>
            </div>
            <div className="field-group">
              <label htmlFor="email-code">Verification code</label>
              <input
                id="email-code"
                className="email-code-input"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={code}
                disabled={blocked}
                placeholder="000000"
                aria-describedby="email-code-hint"
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              <small id="email-code-hint" className="email-code-hint">
                Enter the latest code. It can be used once.
              </small>
            </div>
          </>
        )}
        <AssetButton
          asset="continue-button"
          type="submit"
          busy={busy}
          disabled={blocked || (!token && code.length !== 6)}
        >
          Verify email <ArrowUpRight size={16} />
        </AssetButton>
      </form>
      {!token ? (
        <div className="email-code-resend">
          <button
            className="button secondary full-width"
            type="button"
            onClick={resend}
            disabled={blocked || remaining > 0}
          >
            <RefreshCw size={16} />
            {sending
              ? "Requesting code…"
              : remaining > 0
                ? `Request another code in ${remaining}s`
                : "Send a new code"}
          </button>
          <p>
            Already verified? <Link href="/sign-in">Sign in</Link>
          </p>
        </div>
      ) : (
        <Link className="email-code-fallback" href="/verify-email">
          Use an email verification code instead
        </Link>
      )}
    </div>
  );
}
