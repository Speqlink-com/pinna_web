"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
} from "lucide-react";
import { Brand } from "./brand";
import { AuthVisual } from "./auth-visual";
import { AssetButton } from "./asset-button";
import { api, ApiError } from "@/lib/api";
import { rememberEmailVerification } from "@/lib/email-verification";
import { EmailVerification } from "./email-verification";
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
    title: "Sign in to pinnaa",
    description:
      "Find providers, compare services, and manage your connections.",
    label: "SIGN IN TO pinnaa",
  },
  "sign-up": {
    title: "Create your account",
    description: "Choose a personal or business account to get started.",
    label: "GET STARTED WITH pinnaa",
  },
  "forgot-password": {
    title: "Reset your password",
    description: "We’ll email you a secure link to reset your password.",
    label: "PASSWORD RECOVERY",
  },
  "reset-password": {
    title: "Choose a new password",
    description: "Choose a strong password to protect your account.",
    label: "RESET YOUR PASSWORD",
  },
  "verify-email": {
    title: "Verify your email",
    description: "Enter the six-digit code from your email to continue.",
    label: "VERIFY YOUR EMAIL",
  },
  "change-password": {
    title: "Make this account yours.",
    description:
      "Replace the temporary password from your invitation before continuing.",
    label: "SECURE YOUR ACCOUNT",
  },
  "verify-security": {
    title: "Two-step verification",
    description:
      "Verify with an authenticator app. Admins can also use a code sent to their verified email.",
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
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [currentPassword, setCurrentPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failure, setFailure] = useState(""),
    [consent, setConsent] = useState(false),
    [secret, setSecret] = useState(""),
    [uri, setUri] = useState(""),
    [qrCode, setQrCode] = useState(""),
    [recovery, setRecovery] = useState<string[]>([]),
    [copied, setCopied] = useState(false),
    [mfaMethod, setMfaMethod] = useState<"authenticator" | "email">(
      "authenticator",
    ),
    [emailCodeSent, setEmailCodeSent] = useState(false),
    [resendSeconds, setResendSeconds] = useState(0);
  const adminMfa = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const codeInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(
      () => setResendSeconds((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendSeconds]);
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
      "No pinnaa account is linked to this Google account yet. Create an account first.",
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
          mfaMethod === "email" ? "auth/mfa/email/verify" : "auth/mfa/verify",
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
      const result = await api<{
        redirect?: string;
        message?: string;
        resendAfter?: number;
      }>(`auth/${path}`, body);
      if (isSignup) {
        rememberEmailVerification(String(values.email), result.resendAfter);
        window.location.assign("/verify-email");
      } else if (result.redirect) window.location.assign(result.redirect);
      else setMessage(result.message ?? "All done.");
    } catch (error) {
      if (
        isLogin &&
        error instanceof ApiError &&
        error.code === "EMAIL_NOT_VERIFIED"
      ) {
        rememberEmailVerification(String(values.email), error.resendAfter);
        window.location.assign("/verify-email");
        return;
      }
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
      const result = await api<{ secret: string; uri: string; qrCode: string }>(
        "auth/mfa/setup",
        {},
      );
      setSecret(result.secret);
      setUri(result.uri);
      setQrCode(result.qrCode);
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
            {mode === "verify-email" ? (
              <EmailVerification key={token} token={token} />
            ) : (
              <>
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
                {message && mode !== "verify-security" ? (
                  <div className="success-state" role="status">
                    <span className="success-symbol">
                      <Image
                        src="/verified-check-icon.webp"
                        width={28}
                        height={28}
                        alt=""
                      />
                    </span>
                    <h3>
                      {mode === "sign-up"
                        ? "Check your inbox."
                        : "You’re all set."}
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
                        await navigator.clipboard.writeText(
                          recovery.join("\n"),
                        );
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
                      <div
                        className="account-choices"
                        aria-label="Account purpose"
                      >
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
                            Bismart Business
                            <small>Manage your portfolios</small>
                          </span>
                          {business ? <Check size={15} /> : null}
                        </button>
                      </div>
                    ) : null}
                    {business && isSignup ? (
                      <p className="business-hint">
                        One account for your clinic, chemist, ambulance service,
                        or agrovet. Verify your email and secure your account,
                        then register each business location for pinnaa
                        approval.
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
                          {isSignup
                            ? "Sign up with Google"
                            : "Sign in with Google"}
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
                    <form
                      onSubmit={submit}
                      className="auth-form"
                      aria-busy={busy}
                    >
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
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
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
                      {mode === "verify-security" ? (
                        <>
                          {message && (
                            <div className="notice" role="status">
                              {message}
                            </div>
                          )}
                          {adminMfa && (
                            <div
                              className="client-primary-tabs"
                              aria-label="Verification method"
                            >
                              <button
                                type="button"
                                className={
                                  mfaMethod === "authenticator" ? "active" : ""
                                }
                                onClick={() => {
                                  setMfaMethod("authenticator");
                                  setFailure("");
                                }}
                              >
                                Authenticator
                              </button>
                              <button
                                type="button"
                                className={
                                  mfaMethod === "email" ? "active" : ""
                                }
                                onClick={() => {
                                  setMfaMethod("email");
                                  setFailure("");
                                }}
                              >
                                Email OTP
                              </button>
                            </div>
                          )}
                          {mfaMethod === "email" && (
                            <div className="verification-box">
                              <p>
                                Send a six-digit sign-in code to your verified
                                admin email. The code expires in five minutes.
                              </p>
                              <button
                                type="button"
                                className="button secondary full-width"
                                disabled={busy || resendSeconds > 0}
                                onClick={async () => {
                                  setBusy(true);
                                  setFailure("");
                                  try {
                                    const result = await api<{
                                      message: string;
                                      resendAfter: number;
                                    }>("auth/mfa/email/send", {});
                                    setMessage(result.message);
                                    setEmailCodeSent(true);
                                    setResendSeconds(result.resendAfter);
                                    codeInput.current?.focus();
                                  } catch (e) {
                                    setFailure(
                                      e instanceof Error
                                        ? e.message
                                        : "Could not send code.",
                                    );
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                {resendSeconds > 0
                                  ? `Resend in ${resendSeconds}s`
                                  : emailCodeSent
                                    ? "Resend email code"
                                    : "Send email code"}
                              </button>
                            </div>
                          )}
                          {mfaMethod === "authenticator" && needsSetup ? (
                            <>
                              <div className="verification-box">
                                <ShieldCheck size={28} />
                                <p>
                                  Business and admin accounts use two-step
                                  verification. Add pinnaa to your
                                  authenticator, then enter its six-digit code.
                                </p>
                              </div>
                              {!secret ? (
                                <button
                                  className="button secondary full-width"
                                  type="button"
                                  disabled={busy}
                                  onClick={setup}
                                >
                                  Set up authenticator{" "}
                                  <ArrowUpRight size={16} />
                                </button>
                              ) : (
                                <div className="secret-box">
                                  {qrCode && (
                                    <Image
                                      src={qrCode}
                                      width={200}
                                      height={200}
                                      unoptimized
                                      alt="Scan this QR code with your authenticator app"
                                      className="authenticator-qr"
                                    />
                                  )}
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
                          {mfaMethod === "email" ||
                          (mfaMethod === "authenticator" &&
                            (!needsSetup || secret)) ? (
                            <div className="field-group">
                              <label htmlFor="code">
                                {mfaMethod === "email"
                                  ? "Email sign-in code"
                                  : "Authenticator or recovery code"}
                              </label>
                              <div className="input-wrap">
                                <ShieldCheck size={17} />
                                <input
                                  key={mfaMethod}
                                  ref={codeInput}
                                  id="code"
                                  name="code"
                                  type="text"
                                  inputMode={
                                    mfaMethod === "email" ? "numeric" : "text"
                                  }
                                  pattern={
                                    mfaMethod === "email"
                                      ? "[0-9]{6}"
                                      : undefined
                                  }
                                  enterKeyHint="done"
                                  autoComplete="one-time-code"
                                  required
                                  minLength={6}
                                  maxLength={mfaMethod === "email" ? 6 : 80}
                                  placeholder={
                                    mfaMethod === "email"
                                      ? "Enter six-digit email code"
                                      : "Enter your code"
                                  }
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
                          mode === "verify-security" &&
                          mfaMethod === "authenticator" &&
                          needsSetup &&
                          !secret
                        }
                      >
                        {isLogin
                          ? "Sign in"
                          : isSignup
                            ? "Create account"
                            : mode === "forgot-password"
                              ? "Send reset link"
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
                    {isLogin ? (
                      <p className="email-code-fallback">
                        <Link
                          href="/verify-email"
                          onClick={() => rememberEmailVerification(email, 0)}
                        >
                          Need an email verification code?
                        </Link>
                      </p>
                    ) : null}
                  </>
                )}
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
