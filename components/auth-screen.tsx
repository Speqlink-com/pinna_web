"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  Building2,
  ShieldCheck,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { Brand } from "./brand";
import { AuthVisual } from "./auth-visual";
import { AssetButton } from "./asset-button";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
export type AuthMode =
  | "sign-in"
  | "sign-up"
  | "forgot-password"
  | "reset-password"
  | "verify-email"
  | "change-password"
  | "verify-security";
const details: Record<
  AuthMode,
  { title: string; description: string; label: string }
> = {
  "sign-in": {
    title: "Welcome back.",
    description: "Good to see you. Let’s find what you need.",
    label: "SIGN IN TO PINNA",
  },
  "sign-up": {
    title: "Your connection to better.",
    description: "A little less searching. A lot more peace of mind.",
    label: "GET STARTED WITH PINNA",
  },
  "forgot-password": {
    title: "Let’s get you back in.",
    description: "We’ll email you a secure link to reset your password.",
    label: "PASSWORD RECOVERY",
  },
  "reset-password": {
    title: "A fresh start.",
    description: "Choose a strong password to protect your account.",
    label: "RESET YOUR PASSWORD",
  },
  "verify-email": {
    title: "Make it official.",
    description: "Confirm your email to start your Pinna journey.",
    label: "VERIFY YOUR EMAIL",
  },
  "change-password": {
    title: "Make this account yours.",
    description:
      "Replace the temporary password from your invitation before continuing.",
    label: "SECURE YOUR ACCOUNT",
  },
  "verify-security": {
    title: "One more layer of care.",
    description: "Protect your admin account with an authenticator app.",
    label: "TWO-STEP VERIFICATION",
  },
};
function Password({
  name = "password",
  label = "Password",
  creation = false,
  value,
  onChange,
}: {
  name?: string;
  label?: string;
  creation?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field-group">
      <label htmlFor={name}>{label}</label>
      <div className="input-wrap">
        <Image src="/lock.webp" width={17} height={17} alt="" />
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={creation ? "new-password" : "current-password"}
          required
          minLength={creation ? 12 : 1}
          maxLength={128}
          placeholder={
            creation ? "Create a strong password" : "Enter your password"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="input-action"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
export function AuthScreen({
  mode,
  token = "",
  error = "",
  expired = false,
  user = null,
}: {
  mode: AuthMode;
  token?: string;
  error?: string;
  expired?: boolean;
  user?: User | null;
}) {
  const [business, setBusiness] = useState(false),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [currentPassword, setCurrentPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failure, setFailure] = useState(""),
    [consent, setConsent] = useState(false),
    [secret, setSecret] = useState(""),
    [uri, setUri] = useState(""),
    [recovery, setRecovery] = useState<string[]>([]),
    [copied, setCopied] = useState(false);
  const isSignup = mode === "sign-up",
    isLogin = mode === "sign-in",
    isCreate =
      isSignup || mode === "reset-password" || mode === "change-password";
  const [needsSetup, setNeedsSetup] = useState(
    user ? !user.mfaEnrolled : false,
  );
  const meta = details[mode];
  const oauthError: Record<string, string> = {
    "google-unavailable":
      "Google sign-in is not configured yet. You can use your email instead.",
    "google-failed": "Google sign-in could not be completed. Please try again.",
    "existing-account":
      "This email already has a password account. Sign in with that password.",
    "register-first":
      "No Pinna account is linked to this Google account yet. Create an account first.",
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFailure("");
    setMessage("");
    if (isCreate && password !== confirmation) {
      setFailure("Your passwords don’t match yet.");
      return;
    }
    setBusy(true);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode === "verify-security") {
        const result = await api<{ redirect: string; recoveryCodes: string[] }>(
          "auth/mfa/verify",
          { code: values.code },
        );
        if (result.recoveryCodes.length) {
          setRecovery(result.recoveryCodes);
          setNeedsSetup(false);
        } else window.location.assign(result.redirect);
        return;
      }
      const path = (
        {
          "sign-in": "login",
          "sign-up": "register",
          "forgot-password": "forgot-password",
          "reset-password": "reset-password",
          "verify-email": "verify-email",
          "change-password": "change-password",
        } as const
      )[mode];
      const body = isSignup
        ? {
            name: values.name,
            email: values.email,
            password,
            accountType: business ? "BUSINESS" : "USER",
            consent,
          }
        : isLogin
          ? { email: values.email, password }
          : mode === "forgot-password"
            ? { email: values.email }
            : mode === "change-password"
              ? { currentPassword, password }
              : { token, ...(mode === "reset-password" ? { password } : {}) };
      const result = await api<{ redirect?: string; message?: string }>(
        `auth/${path}`,
        body,
      );
      if (result.redirect) window.location.assign(result.redirect);
      else setMessage(result.message ?? "All done.");
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "Could not connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function setup() {
    setBusy(true);
    setFailure("");
    try {
      const result = await api<{ secret: string; uri: string }>(
        "auth/mfa/setup",
        {},
      );
      setSecret(result.secret);
      setUri(result.uri);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const passwordRules = [
    { label: "12+ characters", pass: password.length >= 12 },
    {
      label: "Upper & lowercase",
      pass: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    { label: "A number", pass: /[0-9]/.test(password) },
  ];
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <div className="auth-header-right">
          <span>By Bismart Inc.</span>
          <Link href="/help">
            Need a hand? <ArrowUpRight size={13} />
          </Link>
        </div>
      </header>
      <main className="auth-main">
        <AuthVisual business={business} />
        <section className="auth-form-panel">
          <div className={`auth-form-inner ${isSignup ? "signup-inner" : ""}`}>
            {mode !== "sign-in" && mode !== "sign-up" ? (
              <Link href="/sign-in" className="back-link">
                <Image src="/left-chevron.webp" width={15} height={15} alt="" />{" "}
                Back to sign in
              </Link>
            ) : (
              <div className="auth-kicker">
                <span className="tiny-dot" />
                {meta.label}
              </div>
            )}
            <h2>{meta.title}</h2>
            <p className="auth-description">{meta.description}</p>
            {failure || oauthError[error] ? (
              <div className="notice error" role="alert">
                {failure || oauthError[error]}
              </div>
            ) : null}
            {expired ? (
              <div className="notice">
                Your session ended. Sign in to continue.
              </div>
            ) : null}
            {message ? (
              <div className="success-state" role="status">
                <span className="success-symbol">
                  <CheckCircle2 size={28} />
                </span>
                <h3>
                  {mode === "sign-up" ? "Check your inbox." : "You’re all set."}
                </h3>
                <p>{message}</p>
                <Link href="/sign-in" className="button primary">
                  Back to sign in <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : recovery.length ? (
              <div className="recovery-state">
                <ShieldCheck size={28} />
                <h3>Keep these codes safe.</h3>
                <p>
                  Each code can be used once if you lose access to your
                  authenticator. Store them somewhere private.
                </p>
                <div className="recovery-grid">
                  {recovery.map((c) => (
                    <code key={c}>{c}</code>
                  ))}
                </div>
                <button
                  className="button secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(recovery.join("\n"));
                    setCopied(true);
                  }}
                >
                  <Copy size={16} />
                  {copied ? "Copied" : "Copy recovery codes"}
                </button>
                <Link href="/dashboard" className="button primary">
                  I’ve saved my codes <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                {isSignup ? (
                  <div className="account-choices" aria-label="Account purpose">
                    <button
                      type="button"
                      aria-pressed={!business}
                      className={!business ? "selected" : ""}
                      onClick={() => setBusiness(false)}
                    >
                      <UserRound size={18} />
                      <span>
                        For myself<small>Find & connect with care</small>
                      </span>
                      {!business ? <Check size={15} /> : null}
                    </button>
                    <button
                      type="button"
                      aria-pressed={business}
                      className={business ? "selected" : ""}
                      onClick={() => setBusiness(true)}
                    >
                      <Building2 size={18} />
                      <span>
                        Bismart Business<small>Manage your portfolios</small>
                      </span>
                      {business ? <Check size={15} /> : null}
                    </button>
                  </div>
                ) : null}
                {business && isSignup ? (
                  <p className="business-hint">
                    One account for your clinic, chemist, ambulance service, or
                    agrovet. Add your portfolios after signing up.
                  </p>
                ) : null}
                {isLogin || isSignup ? (
                  <>
                    <AssetButton
                      asset="google-button"
                      variant="google"
                      type="button"
                      disabled={isSignup && !consent}
                      onClick={() =>
                        window.location.assign(
                          `/api/v1/auth/google/start?intent=${isSignup ? "register" : "login"}&account=${business ? "BUSINESS" : "USER"}&consent=${consent}`,
                        )
                      }
                    >
                      {isSignup ? "Sign up with Google" : "Sign in with Google"}
                    </AssetButton>
                    {isSignup && !consent ? (
                      <p className="google-consent-hint">
                        Accept the terms below to enable Google sign-up.
                      </p>
                    ) : null}
                    <div className="divider">
                      <span>or continue with email</span>
                    </div>
                  </>
                ) : null}
                <form onSubmit={submit} className="auth-form" aria-busy={busy}>
                  {isSignup ? (
                    <div className="field-group">
                      <label htmlFor="name">Full name</label>
                      <div className="input-wrap">
                        <Image
                          src="/profile-icon.webp"
                          width={17}
                          height={17}
                          alt=""
                        />
                        <input
                          id="name"
                          name="name"
                          required
                          autoComplete="name"
                          minLength={2}
                          maxLength={100}
                          placeholder="Your full name"
                        />
                      </div>
                    </div>
                  ) : null}
                  {isLogin || isSignup || mode === "forgot-password" ? (
                    <div className="field-group">
                      <label htmlFor="email">Email address</label>
                      <div className="input-wrap">
                        <Mail size={17} />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          maxLength={254}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                  ) : null}
                  {mode === "change-password" ? (
                    <Password
                      name="currentPassword"
                      label="Temporary password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                    />
                  ) : null}
                  {isLogin || isCreate ? (
                    <Password
                      creation={isCreate}
                      label={isCreate ? "New password" : "Password"}
                      value={password}
                      onChange={setPassword}
                    />
                  ) : null}
                  {isCreate ? (
                    <>
                      <div className="password-rules" aria-live="polite">
                        {passwordRules.map((rule) => (
                          <span
                            className={rule.pass ? "met" : ""}
                            key={rule.label}
                          >
                            <Check size={12} />
                            {rule.label}
                          </span>
                        ))}
                      </div>
                      <Password
                        name="confirmation"
                        label="Confirm password"
                        creation
                        value={confirmation}
                        onChange={setConfirmation}
                      />
                      {confirmation ? (
                        <p
                          className={`match-hint ${password === confirmation ? "matched" : ""}`}
                        >
                          {password === confirmation
                            ? "Passwords match"
                            : "Passwords don’t match yet"}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                  {isLogin ? (
                    <div className="form-options">
                      <span>
                        <ShieldCheck size={14} /> Your account stays private
                      </span>
                      <Link href="/forgot-password">Forgot password?</Link>
                    </div>
                  ) : null}
                  {mode === "verify-email" ? (
                    <div className="verification-box">
                      <Mail size={30} />
                      <p>
                        {token
                          ? "Use the button below to verify your email address. Your link can only be used once."
                          : "Open the verification link in your inbox, or request a new one below."}
                      </p>
                    </div>
                  ) : null}
                  {mode === "verify-security" ? (
                    <>
                      {needsSetup ? (
                        <>
                          <div className="verification-box">
                            <ShieldCheck size={28} />
                            <p>
                              Admin accounts use two-step verification. Add
                              Pinna to your authenticator, then enter its
                              six-digit code.
                            </p>
                          </div>
                          {!secret ? (
                            <button
                              className="button secondary full-width"
                              type="button"
                              disabled={busy}
                              onClick={setup}
                            >
                              Set up authenticator <ArrowUpRight size={16} />
                            </button>
                          ) : (
                            <div className="secret-box">
                              <span>Manual setup key</span>
                              <code>{secret}</code>
                              <a href={uri}>
                                Open authenticator app{" "}
                                <ArrowUpRight size={13} />
                              </a>
                            </div>
                          )}
                        </>
                      ) : null}
                      {!needsSetup || secret ? (
                        <div className="field-group">
                          <label htmlFor="code">
                            Authenticator or recovery code
                          </label>
                          <div className="input-wrap">
                            <ShieldCheck size={17} />
                            <input
                              id="code"
                              name="code"
                              autoComplete="one-time-code"
                              required
                              minLength={6}
                              maxLength={80}
                              placeholder="Enter your code"
                              autoFocus
                            />
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {isSignup ? (
                    <label className="consent">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        required
                      />
                      <span>
                        I agree to the{" "}
                        <Link href="/terms" target="_blank">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" target="_blank">
                          Privacy Notice
                        </Link>
                        .
                      </span>
                    </label>
                  ) : null}
                  <AssetButton
                    asset={
                      isLogin
                        ? "sign-in-button"
                        : isSignup
                          ? "create-account-button"
                          : "continue-button"
                    }
                    type="submit"
                    busy={busy}
                    disabled={
                      (mode === "verify-email" && !token) ||
                      (mode === "verify-security" && needsSetup && !secret)
                    }
                  >
                    {isLogin
                      ? "Sign in"
                      : isSignup
                        ? "Create account"
                        : mode === "forgot-password"
                          ? "Send reset link"
                          : mode === "verify-email"
                            ? "Verify my email"
                            : mode === "verify-security"
                              ? "Verify & continue"
                              : "Save password"}
                  </AssetButton>
                </form>
                {isLogin || isSignup ? (
                  <p className="auth-switch">
                    {isLogin ? "New here?" : "Already connected?"}{" "}
                    <Link href={isLogin ? "/sign-up" : "/sign-in"}>
                      {isLogin ? "Create an account" : "Sign in"}{" "}
                      <ArrowUpRight size={13} />
                    </Link>
                  </p>
                ) : null}
                {isLogin || mode === "verify-email" ? (
                  <details className="resend-details">
                    <summary>Need a new verification email?</summary>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy(true);
                        setFailure("");
                        try {
                          const email = new FormData(e.currentTarget).get(
                            "email",
                          );
                          const result = await api<{ message: string }>(
                            "auth/resend-verification",
                            { email },
                          );
                          setMessage(result.message);
                        } catch (err) {
                          setFailure(
                            err instanceof Error
                              ? err.message
                              : "Please try again.",
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <label className="sr-only" htmlFor="resend-email">
                        Email address
                      </label>
                      <input
                        id="resend-email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                      <button type="submit" disabled={busy}>
                        Resend link
                      </button>
                    </form>
                  </details>
                ) : null}
              </>
            )}
            <div className="auth-trust">
              <LockKeyhole size={13} />
              <span>A secure connection. A personal choice.</span>
            </div>
          </div>
        </section>
      </main>
      <footer className="auth-footer">
        <span>
          © {new Date().getFullYear()} Bismart Inc. All rights reserved.
        </span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span className="footer-location">
            <span className="tiny-dot" /> Made for connections that matter
          </span>
        </div>
      </footer>
    </div>
  );
}
