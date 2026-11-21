import Link from "next/link";
import {
  ArrowUpRight,
  FileCheck2,
  ShieldCheck,
  Building2,
  Clock3,
} from "lucide-react";
import type { DashboardData, User } from "@/lib/types";
import { PremiumIcon } from "./premium-icon";

const states: Record<string, string> = {
  SUBMITTED: "Awaiting review",
  ADMIN_RECOMMENDED: "Final approval",
};
export function AdminOverview({
  user,
  data,
  preview = false,
}: {
  user: User;
  data: DashboardData;
  preview?: boolean;
}) {
  const base = preview
    ? "/preview/admin?section=applications"
    : "/dashboard/applications";
  const queue = data.portfolios.filter((p) =>
    ["SUBMITTED", "ADMIN_RECOMMENDED"].includes(p.status),
  );
  const icons = [FileCheck2, Building2, ShieldCheck, Clock3];
  return (
    <div className="admin-overview">
      <div className="provider-page-heading">
        <div>
          <span className="provider-eyebrow">
            {user.role === "SUPER_ADMIN"
              ? "PINNAA PLATFORM ADMINISTRATION"
              : "PINNAA NETWORK OPERATIONS"}
          </span>
          <h1>
            Hello, {user.name.split(" ")[0]}
            <span>.</span>
          </h1>
          <p>A clearer view of the network. A more confident next decision.</p>
        </div>
        <Link className="button primary" href={base}>
          Open applications <ArrowUpRight size={17} />
        </Link>
      </div>
      <section className="provider-intro-banner" aria-label="Network oversight">
        <div>
          <span>TRUST IS BUILT ONE REVIEW AT A TIME</span>
          <h2>
            A trusted network
            <br />
            starts with you.
          </h2>
          <p>
            {user.role === "SUPER_ADMIN"
              ? "Review business recommendations, manage administrative access and keep every published location accountable."
              : "Review business details and supporting evidence, request changes where needed and recommend eligible locations for approval."}
          </p>
          <Link
            className="provider-banner-link"
            href={
              preview
                ? base
                : `${base}?status=${user.role === "SUPER_ADMIN" ? "ADMIN_RECOMMENDED" : "SUBMITTED"}`
            }
          >
            Continue reviewing <ArrowUpRight size={17} />
          </Link>
        </div>
        <span className="admin-intro-icon" aria-hidden="true">
          <ShieldCheck size={61} strokeWidth={1.4} />
        </span>
      </section>
      <section className="stats-grid" aria-label="Network overview metrics">
        {data.stats.map((stat, i) => {
          const Icon = icons[i % icons.length];
          return (
            <article className="stat-card" key={stat.label}>
              <div>
                <span>{stat.label}</span>
                <Icon size={20} />
              </div>
              <strong>{stat.value.toLocaleString()}</strong>
              <p>{stat.detail}</p>
            </article>
          );
        })}
      </section>
      <section className="provider-section">
        <div className="provider-section-heading">
          <div>
            <h2>Ready for your attention</h2>
            <p>Recent business submissions in the review queue.</p>
          </div>
          <Link href={base}>View applications</Link>
        </div>
        {queue.length ? (
          queue.slice(0, 6).map((p) => (
            <Link
              className="admin-queue-row"
              key={p.id}
              href={
                preview ? base : `${base}?portfolio=${encodeURIComponent(p.id)}`
              }
            >
              <PremiumIcon name="business" size={35} />
              <div>
                <strong>{p.name}</strong>
                <p>
                  {p.category} · {p.county || "Location not set"}
                </p>
              </div>
              <span className={`status-badge status-${p.status.toLowerCase()}`}>
                {states[p.status]}
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))
        ) : (
          <div className="provider-first-business">
            <FileCheck2 size={32} />
            <h3>Every decision makes a difference.</h3>
            <p>
              Open Applications to browse business submissions and approval
              statuses.
            </p>
            <Link className="button secondary" href={base}>
              Browse applications <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>
      <div className="provider-overview-grid">
        <section className="provider-section provider-help-card">
          <ShieldCheck size={28} />
          <h3>Clear evidence. Confident decisions.</h3>
          <p>
            Review each location’s details and documents. Recommendation and
            final approval remain separate steps.
          </p>
          <Link href="/help">
            Review guidance <ArrowUpRight size={15} />
          </Link>
        </section>
        <section className="provider-section provider-help-card">
          <PremiumIcon
            name={user.role === "SUPER_ADMIN" ? "team" : "lock"}
            size={30}
          />
          <h3>
            {user.role === "SUPER_ADMIN"
              ? "The people behind the platform."
              : "Your account, protected."}
          </h3>
          <p>
            {user.role === "SUPER_ADMIN"
              ? "Manage your admin team and keep access aligned with each person’s responsibility."
              : "Manage your password and authentication methods from account settings."}
          </p>
          <Link
            href={
              preview
                ? `/preview/admin?section=${user.role === "SUPER_ADMIN" ? "team" : "settings"}`
                : `/dashboard/${user.role === "SUPER_ADMIN" ? "team" : "settings"}`
            }
          >
            {user.role === "SUPER_ADMIN"
              ? "Manage admin team"
              : "Account settings"}
            <ArrowUpRight size={15} />
          </Link>
        </section>
      </div>
    </div>
  );
}
