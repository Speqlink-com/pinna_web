"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="standalone-state">
      <ShieldCheck size={36} />
      <span className="eyebrow">PINNA</span>
      <h1>We couldn’t load your account</h1>
      <p>The service may be temporarily unavailable. Try again in a moment.</p>
      <button type="button" className="button primary" onClick={retry}>
        Try again
      </button>
      <Link className="button secondary" href="/help">
        Get help
      </Link>
    </main>
  );
}
