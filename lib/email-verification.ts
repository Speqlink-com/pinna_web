const key = "pinna_email_verification";

export function rememberEmailVerification(email: string, resendAfter = 60) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        retryAt: Date.now() + Math.max(0, Math.min(resendAfter, 60)) * 1000,
      }),
    );
  } catch {
    // Verification also works with email entered manually when storage is blocked.
  }
}

export function pendingEmailVerification(): { email: string; retryAt: number } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (typeof saved?.email === "string" && saved.email.length <= 254)
      return { email: saved.email, retryAt: Number(saved.retryAt) || 0 };
  } catch {}
  return { email: "", retryAt: 0 };
}

export function clearEmailVerification() {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}
