"use client";
import { AlertCircle } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-state">
      <AlertCircle size={40} />
      <span className="eyebrow">A MOMENTARY INTERRUPTION</span>
      <h1>We couldn’t load this page.</h1>
      <p>Please try again. Your account details are safe.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
