"use client";
import Link from "next/link";
import {
  Building2,
  Check,
  CheckCheck,
  CircleHelp,
  Clock3,
  FileCheck2,
  HeartPulse,
  Leaf,
  MapPin,
  MessagesSquare,
  PackageCheck,
  Pill,
  Plus,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Truck,
  FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DashboardData, Portfolio, User } from "@/lib/types";

const states: Record<Portfolio["status"], string> = {
  DRAFT: "Draft",
  SUBMITTED: "In review",
  ADMIN_RECOMMENDED: "Final review",
  APPROVED: "Published",
  CHANGES_REQUESTED: "Action needed",
};
function categoryIcon(category: string): LucideIcon {
  if (category.includes("Pharmacy")) return Pill;
  if (category.includes("Ambulance")) return Truck;
  if (/Agrovet|Veterinary/.test(category)) return Leaf;
  if (category.includes("Laboratory")) return FlaskConical;
  if (category.includes("Home")) return HeartPulse;
  return Stethoscope;
}
export function ProviderOverview({
  user,
  data,
  preview = false,
}: {
  user: User;
  data: DashboardData;
  preview?: boolean;
}) {
  const businessHref = preview
    ? "/preview/business?section=portfolios"
    : "/dashboard/portfolios";
  const createHref = preview ? businessHref : `${businessHref}?create=1`;
  const messageHref = preview
    ? "/preview/business?section=messages"
    : "/dashboard/messages";
  const published = data.portfolios.filter(
    (p) => p.status === "APPROVED",
  ).length;
  const reviewing = data.portfolios.filter((p) =>
    ["SUBMITTED", "ADMIN_RECOMMENDED"].includes(p.status),
  ).length;
  const drafts = data.portfolios.filter((p) =>
    ["DRAFT", "CHANGES_REQUESTED"].includes(p.status),
  );
  const metrics = [
    {
      label: "Business locations",
      value: data.portfolios.length,
      detail: "Your connected businesses",
      icon: Building2,
      tone: "teal",
    },
    {
      label: "Published",
      value: published,
      detail: "Visible to customers",
      icon: ShieldCheck,
      tone: "green",
    },
    {
      label: "In review",
      value: reviewing,
      detail: "Awaiting pinnaa approval",
      icon: FileCheck2,
      tone: "orange",
    },
    {
      label: "Conversations",
      value: data.conversations.length,
      detail: "Customer connections",
      icon: MessagesSquare,
      tone: "purple",
    },
  ];
  return (
    <div className="provider-overview">
      <div className="provider-page-heading">
        <div>
          <span className="provider-eyebrow">YOUR PROVIDER WORKSPACE</span>
          <h1>
            Hello, {user.name.split(" ")[0]}
            <span>.</span>
          </h1>
          <p>Every business, every location. A clearer view of your day.</p>
        </div>
        <Link className="button primary" href={createHref}>
          <Plus size={18} /> Register a business
        </Link>
      </div>
      <section
        className="provider-intro-banner"
        aria-label="Manage your business network"
      >
        <div>
          <span>GROW YOUR PRESENCE</span>
          <h2>
            Your services.
            <br />
            Their next connection.
          </h2>
          <p>Bring your businesses closer to the people who need them.</p>
          <Link href={businessHref} className="provider-banner-link">
            <Building2 size={16} /> Manage your businesses
          </Link>
        </div>
        <div className="provider-banner-art" aria-hidden="true">
          <span className="provider-art-orbit orbit-one" />
          <span className="provider-art-orbit orbit-two" />
          <span className="provider-art-centre">
            <Building2 size={42} strokeWidth={1.4} />
          </span>
          <span className="provider-art-node node-one">
            <Pill size={24} />
          </span>
          <span className="provider-art-node node-two">
            <Stethoscope size={24} />
          </span>
          <span className="provider-art-node node-three">
            <Leaf size={24} />
          </span>
          <div className="provider-art-caption">
            <CheckCheck size={17} /> One connected workspace
          </div>
        </div>
      </section>
      <section
        className="provider-metric-grid"
        aria-label="Business overview metrics"
      >
        {metrics.map((m) => (
          <article className="provider-metric" key={m.label}>
            <div>
              <span className="provider-metric-label">{m.label}</span>
              <span className={`provider-metric-icon ${m.tone}`}>
                <m.icon size={20} />
              </span>
            </div>
            <strong>{m.value.toLocaleString()}</strong>
            <p>{m.detail}</p>
          </article>
        ))}
      </section>
      <div className="provider-overview-grid">
        <section className="provider-section provider-businesses">
          <div className="provider-section-heading">
            <div>
              <h2>Your businesses</h2>
              <p>A home for every service location.</p>
            </div>
            <Link href={businessHref}>View all</Link>
          </div>
          {data.portfolios.length ? (
            <div className="provider-business-list">
              {data.portfolios.slice(0, 4).map((p) => {
                const Icon = categoryIcon(p.category);
                const detail = preview
                  ? businessHref
                  : `${businessHref}?portfolio=${encodeURIComponent(p.id)}`;
                return (
                  <article className="provider-business-row" key={p.id}>
                    <span className="provider-business-icon">
                      <Icon size={24} strokeWidth={1.6} />
                    </span>
                    <div className="provider-business-summary">
                      <Link href={detail}>{p.name}</Link>
                      <span>{p.category}</span>
                      <p>
                        <MapPin size={13} /> {p.county || "Location not set"}
                        {p.address ? ` · ${p.address}` : ""}
                      </p>
                    </div>
                    <div className="provider-business-meta">
                      <span
                        className={`provider-state ${p.status.toLowerCase()}`}
                      >
                        {p.status === "APPROVED" && <Check size={12} />}
                        {states[p.status]}
                      </span>
                      <span>
                        {p.services.length}{" "}
                        {p.services.length === 1 ? "offering" : "offerings"}
                      </span>
                    </div>
                    <Link
                      className="provider-manage-link"
                      href={detail}
                      aria-label={`Manage ${p.name}`}
                    >
                      <Settings2 size={17} />
                      <span>Manage</span>
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="provider-first-business">
              <span>
                <Building2 size={32} strokeWidth={1.4} />
              </span>
              <h3>Your next chapter starts here.</h3>
              <p>
                Register your first business, add its location and services,
                then submit it for approval.
              </p>
              <Link href={createHref} className="button primary">
                <Plus size={17} /> Register your first business
              </Link>
            </div>
          )}
          <div className="provider-section-footer">
            <ShieldCheck size={16} />
            <p>
              Each location is reviewed separately before it appears in
              discovery.
            </p>
          </div>
        </section>
        <div className="provider-side-panels">
          <section className="provider-section provider-next-steps">
            <div className="provider-section-heading">
              <div>
                <h2>Your next steps</h2>
                <p>Keep your business moving.</p>
              </div>
              <span className="provider-section-symbol">
                <CheckCheck size={20} />
              </span>
            </div>
            <Link
              className="provider-task"
              href={data.portfolios.length ? businessHref : createHref}
            >
              <span className={data.portfolios.length ? "task-done" : ""}>
                {data.portfolios.length ? (
                  <Check size={17} />
                ) : (
                  <Building2 size={17} />
                )}
              </span>
              <div>
                <strong>Register your business</strong>
                <p>Add a location and tell customers what you offer.</p>
              </div>
            </Link>
            <Link
              className="provider-task"
              href={
                drafts.length && !preview
                  ? `${businessHref}?portfolio=${encodeURIComponent(drafts[0].id)}&tab=documents`
                  : businessHref
              }
            >
              <span className={published || reviewing ? "task-done" : ""}>
                {published || reviewing ? (
                  <Check size={17} />
                ) : (
                  <FileCheck2 size={17} />
                )}
              </span>
              <div>
                <strong>
                  {drafts.length
                    ? `${drafts.length} business ${drafts.length === 1 ? "needs" : "locations need"} attention`
                    : "Complete verification"}
                </strong>
                <p>Keep registration and operating documents current.</p>
              </div>
            </Link>
            <Link
              className="provider-task"
              href={
                published && !preview
                  ? `${businessHref}?portfolio=${encodeURIComponent(data.portfolios.find((p) => p.status === "APPROVED")!.id)}&tab=operations`
                  : businessHref
              }
            >
              <span>
                <SlidersHorizontal size={17} />
              </span>
              <div>
                <strong>Keep availability up to date</strong>
                <p>Manage hours, service availability and optional stock.</p>
              </div>
            </Link>
          </section>
          <section className="provider-help-card">
            <span>
              <CircleHelp size={22} />
            </span>
            <div>
              <h3>A little help goes a long way.</h3>
              <p>Find guidance on getting your business connected.</p>
              <Link href="/help">Visit the help centre</Link>
            </div>
          </section>
        </div>
      </div>
      <div className="provider-lower-grid">
        <section className="provider-section">
          <div className="provider-section-heading">
            <div>
              <h2>Customer conversations</h2>
              <p>Good connections start with a conversation.</p>
            </div>
            <Link href={messageHref}>Open messages</Link>
          </div>
          {data.conversations.length ? (
            data.conversations.slice(0, 2).map((c) => (
              <Link
                href={
                  preview
                    ? messageHref
                    : `${messageHref}?conversation=${encodeURIComponent(c.id)}`
                }
                className="provider-conversation"
                key={c.id}
              >
                <span className="provider-person-avatar">
                  {c.customer_name[0]}
                </span>
                <div>
                  <strong>
                    {c.customer_name}
                    <span>{c.provider_name}</span>
                  </strong>
                  <p>{c.last_message || "A new connection. Say hello."}</p>
                </div>
                <MessagesSquare size={18} />
              </Link>
            ))
          ) : (
            <div className="provider-empty-conversation">
              <MessagesSquare size={24} />
              <p>
                Customer enquiries will appear here once you start connecting.
              </p>
            </div>
          )}
        </section>
        <section className="provider-section provider-quick-actions">
          <div className="provider-section-heading">
            <div>
              <h2>Quick access</h2>
              <p>Your everyday business essentials.</p>
            </div>
          </div>
          <div>
            <Link href={businessHref}>
              <PackageCheck size={23} />
              <strong>Offerings & stock</strong>
              <span>Manage each business</span>
            </Link>
            <Link
              href={preview ? businessHref : `${businessHref}?view=profile`}
            >
              <Building2 size={23} />
              <strong>Business profile</strong>
              <span>Your owner details</span>
            </Link>
            <Link href={businessHref}>
              <Clock3 size={23} />
              <strong>Hours & location</strong>
              <span>Keep details current</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
