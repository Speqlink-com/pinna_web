"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Portfolio } from "@/lib/types";
import { PremiumIcon } from "./premium-icon";

const labels: Record<Portfolio["status"], string> = {
  DRAFT: "Complete registration and submit for approval.",
  SUBMITTED: "Submitted. Your business is awaiting review.",
  ADMIN_RECOMMENDED: "Your business is awaiting final approval.",
  CHANGES_REQUESTED:
    "Changes requested. Open your business to review the feedback.",
  APPROVED: "Approved and published in the provider network.",
};

export function BusinessNotifications({
  portfolios,
  preview = false,
}: {
  portfolios: Portfolio[];
  preview?: boolean;
}) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (panel.current && !panel.current.contains(event.target as Node))
        panel.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && panel.current?.open) {
        panel.current.open = false;
        panel.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const href = preview
    ? "/preview/business?section=portfolios"
    : "/dashboard/portfolios";
  return (
    <details className="business-notifications" ref={panel}>
      <summary
        className="icon-button"
        aria-label="Open business notifications"
        title="Business notifications"
      >
        <PremiumIcon name="notification" size={27} />
      </summary>
      <section
        className="business-notifications-panel"
        aria-label="Business notifications"
      >
        <header>
          <strong>Business updates</strong>
          <p>Current registration and approval statuses.</p>
        </header>
        {portfolios.length ? (
          <ul>
            {portfolios.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  href={
                    preview
                      ? href
                      : `${href}?portfolio=${encodeURIComponent(p.id)}`
                  }
                  onClick={() => {
                    if (panel.current) panel.current.open = false;
                  }}
                >
                  <PremiumIcon name="business" size={30} />
                  <span>
                    <strong>{p.name}</strong>
                    <span>{labels[p.status]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="business-notifications-empty">
            Register your first business to see its approval status here.
          </p>
        )}
        <Link
          className="business-notifications-all"
          href={href}
          onClick={() => {
            if (panel.current) panel.current.open = false;
          }}
        >
          View all businesses
        </Link>
      </section>
    </details>
  );
}
