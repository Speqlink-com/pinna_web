"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  LayoutGrid,
  Search,
  Bookmark,
  MessagesSquare,
  Building2,
  Settings,
  LogOut,
  MapPin,
  Navigation,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  HeartPulse,
  Pill,
  ShieldCheck,
  Check,
  Clock,
  Users,
  FileCheck2,
  Menu,
  X,
  LoaderCircle,
  Send,
  Stethoscope,
  FlaskConical,
  Truck,
  Leaf,
  CheckCircle2,
  AlertCircle,
  Mail,
  LockKeyhole,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Brand } from "./brand";
import { api } from "@/lib/api";
import {
  portfolioTypes,
  type User,
  type Portfolio,
  type Provider,
  type DashboardData,
  type Message,
} from "@/lib/types";
import { previewData, previewProviders } from "@/lib/preview";
const categoryIcon = (category: string): LucideIcon =>
  category.includes("chemist")
    ? Pill
    : category.includes("Ambulance")
      ? Truck
      : category.includes("Agrovet") || category.includes("Veterinary")
        ? Leaf
        : category.includes("Laboratory")
          ? FlaskConical
          : Stethoscope;
const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Awaiting review",
  ADMIN_RECOMMENDED: "Awaiting final approval",
  APPROVED: "Published",
  CHANGES_REQUESTED: "Changes requested",
};
function Status({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span />
      {statusLabels[status] ?? status}
    </span>
  );
}
function Empty({
  icon: Icon = Building2,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Dashboard({
  user,
  section = "overview",
  preview = false,
}: {
  user: User;
  section?: string;
  preview?: boolean;
}) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN",
    isBusiness = user.role === "BUSINESS";
  const [data, setData] = useState<DashboardData>(() =>
      preview
        ? previewData(user.role)
        : { portfolios: [], conversations: [], admins: [], stats: [] },
    ),
    [loading, setLoading] = useState(!preview),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false),
    [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<Portfolio | null>(null),
    [busy, setBusy] = useState(false);
  const base = preview
    ? `/preview/${isAdmin ? "admin" : isBusiness ? "business" : "customer"}`
    : "/dashboard";
  const href = (value: string) =>
    preview
      ? `${base}?section=${value}`
      : `${base}/${value === "overview" ? "" : value}`;
  const refresh = async () => {
    if (preview) return;
    setLoading(true);
    setError("");
    try {
      setData(await api<DashboardData>("dashboard"));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load your workspace.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    if (!preview)
      api<DashboardData>("dashboard")
        .then((result) => {
          if (active) setData(result);
        })
        .catch((e) => {
          if (active)
            setError(
              e instanceof Error ? e.message : "Unable to load your workspace.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    return () => {
      active = false;
    };
  }, [preview]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  const navigation = isAdmin
    ? [
        { key: "overview", label: "Overview", icon: LayoutGrid },
        { key: "applications", label: "Applications", icon: FileCheck2 },
        ...(user.role === "SUPER_ADMIN"
          ? [{ key: "team", label: "Admin team", icon: Users }]
          : []),
      ]
    : isBusiness
      ? [
          { key: "overview", label: "Overview", icon: LayoutGrid },
          { key: "portfolios", label: "My portfolios", icon: Building2 },
          { key: "messages", label: "Messages", icon: MessagesSquare },
        ]
      : [
          { key: "overview", label: "Discover", icon: Search },
          { key: "saved", label: "Saved providers", icon: Bookmark },
          { key: "messages", label: "Messages", icon: MessagesSquare },
        ];
  const titles: Record<string, string> = {
    overview: isAdmin
      ? "Platform overview"
      : isBusiness
        ? "Business overview"
        : "Discover care",
    portfolios: "My portfolios",
    applications: "Portfolio applications",
    team: "Admin team",
    saved: "Saved providers",
    messages: "Messages",
    settings: "Account settings",
  };
  const notify = (message: string) => setToast(message);
  async function logout() {
    setBusy(true);
    try {
      if (!preview) await api("auth/logout", {});
      window.location.assign("/sign-in");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed. Try again.");
      setBusy(false);
    }
  }
  return (
    <div className="workspace">
      <a className="skip-link" href="#workspace-main">
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "sidebar-open" : ""}`}>
        <div className="sidebar-logo">
          <Brand />
          <button
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-type">
          <span className="workspace-type-icon">
            {isAdmin ? (
              <ShieldCheck size={19} />
            ) : isBusiness ? (
              <Building2 size={19} />
            ) : (
              <HeartPulse size={19} />
            )}
          </span>
          <div>
            <strong>
              {isAdmin
                ? "Pinna Administration"
                : isBusiness
                  ? "Bismart Business"
                  : "Personal workspace"}
            </strong>
            <span>
              {isAdmin
                ? user.role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : "Administrator"
                : isBusiness
                  ? "All your portfolios"
                  : "Care on your terms"}
            </span>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.key}
              href={href(item.key)}
              className={`nav-item ${section === item.key ? "active" : ""}`}
              onClick={() => setMenu(false)}
              aria-current={section === item.key ? "page" : undefined}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.key === "messages" && data.conversations.length > 0 ? (
                <span className="nav-count">{data.conversations.length}</span>
              ) : null}
              {item.key === "applications" &&
              data.portfolios.filter((p) => p.status === "SUBMITTED").length ? (
                <span className="nav-count">
                  {
                    data.portfolios.filter((p) => p.status === "SUBMITTED")
                      .length
                  }
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-mark">＋</span>
            <strong>
              {isBusiness
                ? "Grow your connections."
                : isAdmin
                  ? "Trust starts here."
                  : "A better way to find care."}
            </strong>
            <p>
              {isBusiness
                ? "One account for every service you offer."
                : isAdmin
                  ? "Every review makes the network stronger."
                  : "Your insurance. Your budget. Your choice."}
            </p>
            {isBusiness ? (
              <button onClick={() => setCreating(true)}>
                Add a portfolio <ArrowUpRight size={14} />
              </button>
            ) : (
              <Link href="/help">
                Explore Pinna <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
          <Link
            href={href("settings")}
            className={`nav-item ${section === "settings" ? "active" : ""}`}
          >
            <Settings size={18} /> Account settings
          </Link>
          <button className="nav-item" disabled={busy} onClick={logout}>
            <LogOut size={18} /> Sign out
          </button>
          <div className="sidebar-profile">
            <div className="avatar">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      {menu ? (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      ) : null}
      <div className="workspace-content">
        <header className="workspace-header">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span>Pinna</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{titles[section] ?? "Overview"}</strong>
          </div>
          <div className="workspace-header-actions">
            <span className="secure-label">
              <LockKeyhole size={13} /> Secure workspace
            </span>
            <div className="avatar avatar-small">{user.name[0]}</div>
          </div>
        </header>
        {preview ? (
          <div className="preview-banner">
            <span>
              <AlertCircle size={15} />
              <strong>Design preview</strong> · Synthetic data. Changes stay in
              this view.
            </span>
            <div>
              <Link href="/preview/customer">Customer</Link>
              <Link href="/preview/business">Business</Link>
              <Link href="/preview/admin">Admin</Link>
              <Link href="/sign-in">
                Sign in <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        ) : null}
        <main id="workspace-main" className="workspace-main">
          {error ? (
            <div className="notice error" role="alert">
              {error}
              <button onClick={refresh}>Try again</button>
            </div>
          ) : null}
          {toast ? (
            <div className="toast" role="status">
              <CheckCircle2 size={18} />
              {toast}
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => setToast("")}
              >
                <X size={15} />
              </button>
            </div>
          ) : null}
          {loading ? (
            <div className="workspace-loading" role="status">
              <LoaderCircle className="spin" /> Loading your workspace…
            </div>
          ) : (
            <>
              {section === "settings" ? (
                <Account user={user} preview={preview} />
              ) : section === "messages" ? (
                <Messages
                  user={user}
                  data={data}
                  preview={preview}
                  notify={notify}
                />
              ) : !isBusiness && !isAdmin ? (
                <Discovery
                  savedOnly={section === "saved"}
                  preview={preview}
                  notify={notify}
                  onConnect={() => window.location.assign(href("messages"))}
                />
              ) : (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        {isAdmin
                          ? "PLATFORM OPERATIONS"
                          : "YOUR BUSINESS, CONNECTED"}
                      </div>
                      <h1>
                        {section === "overview" ? (
                          <>
                            Good{" "}
                            {new Intl.DateTimeFormat("en", {
                              hour: "numeric",
                              hour12: false,
                              timeZone: "Africa/Nairobi",
                            })
                              .format(new Date())
                              .startsWith("0")
                              ? "morning"
                              : "day"}
                            , {user.name.split(" ")[0]}
                            <span className="heading-dot">.</span>
                          </>
                        ) : (
                          titles[section]
                        )}
                      </h1>
                      <p>
                        {section === "team"
                          ? "Manage the people who keep the Pinna network trusted."
                          : isAdmin
                            ? "Here’s what needs your attention across the Pinna network."
                            : "A clear view of your services. A closer connection to your customers."}
                      </p>
                    </div>
                    {isBusiness ? (
                      <button
                        className="button primary"
                        onClick={() => setCreating(true)}
                      >
                        <Plus size={17} /> Add portfolio
                      </button>
                    ) : section === "team" && user.role === "SUPER_ADMIN" ? (
                      <button
                        className="button primary"
                        onClick={() => setCreating(true)}
                      >
                        <Plus size={17} /> Invite admin
                      </button>
                    ) : (
                      <span className="date-label">
                        {new Intl.DateTimeFormat("en-KE", {
                          dateStyle: "medium",
                          timeZone: "Africa/Nairobi",
                        }).format(new Date())}
                      </span>
                    )}
                  </div>
                  {section === "overview" ? (
                    <>
                      <div className="stats-grid">
                        {data.stats.map((stat, i) => (
                          <div className="stat-card" key={stat.label}>
                            <div>
                              <span>{stat.label}</span>
                              {i === 0 ? (
                                <Building2 size={17} />
                              ) : i === 1 ? (
                                <ShieldCheck size={17} />
                              ) : i === 2 ? (
                                <MessagesSquare size={17} />
                              ) : (
                                <Clock size={17} />
                              )}
                            </div>
                            <strong>
                              {stat.value.toString().padStart(2, "0")}
                            </strong>
                            <p>{stat.detail}</p>
                          </div>
                        ))}
                      </div>
                      {isBusiness ? (
                        <div className="business-hero">
                          <div>
                            <span className="eyebrow">
                              ONE ACCOUNT. EVERY POSSIBILITY.
                            </span>
                            <h2>
                              Your next connection
                              <br />
                              starts with your portfolio.
                            </h2>
                            <p>
                              Add your services, insurance plans, and prices.
                              <br />
                              Help the right customers find you.
                            </p>
                            <button
                              className="button white"
                              onClick={() => setCreating(true)}
                            >
                              Build your portfolio <ArrowUpRight size={16} />
                            </button>
                          </div>
                          <div className="business-hero-art" aria-hidden="true">
                            <div className="orbit orbit-one" />
                            <div className="orbit orbit-two" />
                            <div className="orbit-center">
                              <Building2 size={34} />
                            </div>
                            <span className="orbit-item orbit-a">
                              <Pill size={24} />
                            </span>
                            <span className="orbit-item orbit-b">
                              <Truck size={23} />
                            </span>
                            <span className="orbit-item orbit-c">
                              <Leaf size={24} />
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="review-callout">
                          <span className="callout-icon">
                            <FileCheck2 size={25} />
                          </span>
                          <div>
                            <h3>Every connection starts with trust.</h3>
                            <p>
                              Provider publication follows Admin review and
                              Super Admin approval. Verification evidence must
                              be reviewed before publication.
                            </p>
                          </div>
                          <Link
                            href={href("applications")}
                            className="text-link"
                          >
                            View applications <ArrowRight size={16} />
                          </Link>
                        </div>
                      )}
                    </>
                  ) : null}
                  {section === "team" ? (
                    <AdminTeam data={data} onInvite={() => setCreating(true)} />
                  ) : (
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>
                            {isAdmin ? "Application queue" : "Your portfolios"}
                          </h2>
                          <p>
                            {isAdmin
                              ? "Portfolio verification and review status."
                              : "Manage each business independently, from one account."}
                          </p>
                        </div>
                        {section === "overview" ? (
                          <Link
                            className="text-link"
                            href={href(isAdmin ? "applications" : "portfolios")}
                          >
                            View all <ArrowUpRight size={15} />
                          </Link>
                        ) : (
                          <span className="count-tag">
                            {data.portfolios.length} total
                          </span>
                        )}
                      </div>
                      {data.portfolios.length ? (
                        <div className="portfolio-list">
                          {data.portfolios
                            .slice(0, section === "overview" ? 4 : 100)
                            .map((p) => {
                              const Icon = categoryIcon(p.category);
                              return (
                                <button
                                  key={p.id}
                                  className="portfolio-row"
                                  onClick={() => setSelected(p)}
                                >
                                  <span className="portfolio-icon">
                                    <Icon size={23} />
                                  </span>
                                  <div className="portfolio-row-name">
                                    <strong>{p.name}</strong>
                                    <span>
                                      {p.category}{" "}
                                      <span className="dot-divider">·</span>{" "}
                                      {p.county}
                                    </span>
                                  </div>
                                  <Status status={p.status} />
                                  <ArrowUpRight size={17} />
                                </button>
                              );
                            })}
                        </div>
                      ) : (
                        <Empty
                          title={
                            isAdmin
                              ? "The queue is clear."
                              : "Your first portfolio starts here."
                          }
                          description={
                            isAdmin
                              ? "New portfolio applications will appear here for review."
                              : "Add a clinic, chemist, ambulance service, or another business you manage."
                          }
                          action={
                            isBusiness ? (
                              <button
                                className="button primary"
                                onClick={() => setCreating(true)}
                              >
                                <Plus size={16} /> Add your first portfolio
                              </button>
                            ) : undefined
                          }
                        />
                      )}
                    </section>
                  )}
                  {section === "overview" ? (
                    <div className="dashboard-bottom-grid">
                      <section className="panel compact-panel">
                        <div className="panel-heading">
                          <h2>
                            {isAdmin ? "Review process" : "Recent connections"}
                          </h2>
                          {!isAdmin ? (
                            <Link className="text-link" href={href("messages")}>
                              <ArrowUpRight size={17} />
                            </Link>
                          ) : null}
                        </div>
                        {isAdmin ? (
                          <ol className="review-steps">
                            <li>
                              <span>01</span>
                              <div>
                                <strong>Review the application</strong>
                                <p>
                                  Check identity, evidence, and portfolio
                                  details.
                                </p>
                              </div>
                            </li>
                            <li>
                              <span>02</span>
                              <div>
                                <strong>Recommend for approval</strong>
                                <p>
                                  Record the outcome and any required changes.
                                </p>
                              </div>
                            </li>
                            <li>
                              <span>03</span>
                              <div>
                                <strong>Super Admin approval</strong>
                                <p>Complete final checks before publication.</p>
                              </div>
                            </li>
                          </ol>
                        ) : data.conversations.length ? (
                          data.conversations.slice(0, 2).map((c) => (
                            <Link
                              key={c.id}
                              href={href("messages")}
                              className="connection-row"
                            >
                              <div className="avatar">{c.customer_name[0]}</div>
                              <div>
                                <strong>{c.customer_name}</strong>
                                <p>{c.last_message ?? "New conversation"}</p>
                              </div>
                              <ArrowUpRight size={16} />
                            </Link>
                          ))
                        ) : (
                          <p className="subtle-empty">
                            Your customer conversations will appear here.
                          </p>
                        )}
                      </section>
                      <section className="panel compact-panel guide-panel">
                        <ShieldCheck size={27} />
                        <h3>
                          {isAdmin
                            ? "Built on accountability."
                            : "Ready to be discovered?"}
                        </h3>
                        <p>
                          {isAdmin
                            ? "Admin permissions are assigned by the platform owner. Every new admin secures their own account before accessing the platform."
                            : "Your portfolio stays private until verification is complete. Keep your contact details, services, and insurance information up to date."}
                        </p>
                        <Link href="/help" className="text-link">
                          How Pinna works <ArrowUpRight size={14} />
                        </Link>
                      </section>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
          <footer className="workspace-footer">
            <span>Pinna by Bismart Inc.</span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/help">
                Help & support <ArrowUpRight size={12} />
              </Link>
            </div>
          </footer>
        </main>
      </div>
      {creating ? (
        <Modal
          title={section === "team" ? "Invite an admin" : "Add a portfolio"}
          onClose={() => setCreating(false)}
        >
          {section === "team" ? (
            <InviteAdmin
              preview={preview}
              done={async (message) => {
                setCreating(false);
                notify(message);
                await refresh();
              }}
            />
          ) : (
            <PortfolioForm
              preview={preview}
              done={async (p, message) => {
                setCreating(false);
                notify(message);
                if (preview && p)
                  setData((d) => ({ ...d, portfolios: [p, ...d.portfolios] }));
                else await refresh();
              }}
            />
          )}
        </Modal>
      ) : null}
      {selected ? (
        <Modal title="Portfolio details" onClose={() => setSelected(null)}>
          <div className="portfolio-detail">
            <Status status={selected.status} />
            <h3>{selected.name}</h3>
            <p>{selected.category}</p>
            <dl>
              <div>
                <dt>Location</dt>
                <dd>
                  {selected.address}, {selected.county}
                </dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{selected.phone || "Not provided in preview"}</dd>
              </div>
              <div>
                <dt>Insurance plans</dt>
                <dd>{selected.insurance.join(", ") || "None listed"}</dd>
              </div>
            </dl>
            <h4>Services & listed prices</h4>
            {selected.services.map((s) => (
              <div className="service-line" key={s.name}>
                <span>{s.name}</span>
                <strong>
                  {s.price === null
                    ? "Request a quote"
                    : `KES ${s.price.toLocaleString()}`}
                </strong>
              </div>
            ))}
            <div className="notice">
              <ShieldCheck size={17} />
              <p>
                Publication requires private verification evidence, Admin
                review, and final Super Admin approval. Evidence submission and
                review are part of the next onboarding phase.
              </p>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
function Discovery({
  savedOnly,
  preview,
  notify,
  onConnect,
}: {
  savedOnly: boolean;
  preview: boolean;
  notify: (s: string) => void;
  onConnect: () => void;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [insurance, setInsurance] = useState(""),
    [county, setCounty] = useState(""),
    [maxPrice, setMaxPrice] = useState(""),
    [radius, setRadius] = useState(""),
    [sort, setSort] = useState("nearest"),
    [providers, setProviders] = useState<Provider[]>(
      preview ? previewProviders : [],
    ),
    [saved, setSaved] = useState<string[]>([]),
    [loading, setLoading] = useState(!preview),
    [error, setError] = useState(""),
    [filters, setFilters] = useState(false),
    [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null),
    [locating, setLocating] = useState(false),
    [details, setDetails] = useState<Provider | null>(null),
    [pending, setPending] = useState("");
  useEffect(() => {
    let active = true;
    if (!preview) {
      api<{ providers: Provider[] }>(savedOnly ? "saved" : "providers")
        .then((result) => {
          if (active) {
            setProviders(result.providers);
            if (savedOnly) setSaved(result.providers.map((p) => p.id));
          }
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      if (!savedOnly)
        api<{ providers: Provider[] }>("saved")
          .then((r) => {
            if (active) setSaved(r.providers.map((p) => p.id));
          })
          .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [preview, savedOnly]);
  const visible = preview
    ? providers.filter(
        (p) =>
          (!savedOnly || saved.includes(p.id)) &&
          (!category || p.category === category) &&
          (!insurance || p.insurance.includes(insurance)) &&
          (!county || p.county.toLowerCase().includes(county.toLowerCase())) &&
          (!query ||
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.services.some((s) =>
              s.name.toLowerCase().includes(query.toLowerCase()),
            )) &&
          (!maxPrice ||
            p.services.some(
              (s) => s.price !== null && s.price <= Number(maxPrice),
            )) &&
          (!radius || (p.distance !== null && p.distance <= Number(radius))),
      )
    : providers;
  const results = [...visible].sort((a, b) =>
    sort === "price"
      ? minPrice(a) - minPrice(b)
      : sort === "name"
        ? a.name.localeCompare(b.name)
        : (a.distance ?? Infinity) - (b.distance ?? Infinity),
  );
  function minPrice(p: Provider) {
    return Math.min(...p.services.map((s) => s.price ?? Infinity));
  }
  async function search(
    e?: FormEvent,
    categoryOverride?: string,
    sortOverride?: string,
  ) {
    e?.preventDefault();
    setError("");
    if (radius && !coords) {
      setError(
        "Share your location to use a distance filter, or clear the distance filter.",
      );
      return;
    }
    if (preview) {
      if (radius && !coords) setError("Share your location first.");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        category: categoryOverride ?? category,
        insurance,
        county,
        maxPrice,
        radius,
        sort: sortOverride ?? sort,
        ...(coords ? { lat: String(coords.lat), lng: String(coords.lng) } : {}),
      });
      const result = await api<{ providers: Provider[] }>(
        `${savedOnly ? "saved" : "providers"}${savedOnly ? "" : `?${params}`}`,
      );
      setProviders(result.providers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }
  function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError(
        "Location is unavailable in this browser. Search by county instead.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
        notify(
          "Location shared for this search only. Apply filters to refresh distances.",
        );
      },
      () => {
        setLocating(false);
        setError("Location was not shared. You can search by county instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }
  async function toggleSaved(p: Provider) {
    if (preview) {
      setSaved((s) =>
        s.includes(p.id) ? s.filter((id) => id !== p.id) : [...s, p.id],
      );
      return;
    }
    setPending(p.id);
    try {
      await api("saved", { portfolioId: p.id, save: !saved.includes(p.id) });
      setSaved((s) =>
        s.includes(p.id) ? s.filter((id) => id !== p.id) : [...s, p.id],
      );
      if (savedOnly)
        setProviders((ps) => ps.filter((item) => item.id !== p.id));
      notify(
        saved.includes(p.id)
          ? "Provider removed from saved."
          : "Provider saved.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save provider.");
    } finally {
      setPending("");
    }
  }
  async function connect(p: Provider) {
    if (preview) {
      notify("Preview connection only. Sign in to contact a real provider.");
      return;
    }
    setPending(p.id);
    try {
      await api("conversations", { portfolioId: p.id });
      onConnect();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect.");
    } finally {
      setPending("");
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR CARE. YOUR CHOICE.</div>
          <h1>
            {savedOnly ? (
              "Your kind of care, saved."
            ) : (
              <>
                Find the right care<span className="heading-dot">.</span>
              </>
            )}
          </h1>
          <p>
            {savedOnly
              ? "The providers you want to keep close."
              : "Compare providers, insurance, and prices. Connect with confidence."}
          </p>
        </div>
        <button
          className="button secondary location-button"
          disabled={locating}
          onClick={locate}
        >
          {locating ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Navigation size={16} />
          )}{" "}
          {coords ? "Location shared" : "Use my location"}
        </button>
      </div>
      {!savedOnly ? (
        <div className="discover-hero">
          <div>
            <span className="eyebrow">LESS SEARCHING. MORE CERTAINTY.</span>
            <h2>
              Care that fits your life.
              <br />
              And your insurance.
            </h2>
            <p>
              A nearby provider is a better match
              <br />
              when they accept your plan.
            </p>
            <span className="hero-small">
              <ShieldCheck size={14} /> Make informed connections
            </span>
          </div>
          <div className="discover-hero-art" aria-hidden="true">
            <div className="discovery-ring" />
            <div className="discovery-ring second" />
            <div className="discovery-center">
              <MapPin size={32} />
            </div>
            <div className="hero-provider-chip">
              <span>
                <HeartPulse size={20} />
              </span>
              <div>
                <strong>The right provider</strong>
                <small>Your insurance · Your budget</small>
              </div>
              <Check size={16} />
            </div>
            <div className="hero-pin hero-pin-one">
              <Pill size={21} />
            </div>
            <div className="hero-pin hero-pin-two">
              <Plus size={24} />
            </div>
          </div>
        </div>
      ) : null}
      {!savedOnly ? (
        <form className="search-panel" onSubmit={search}>
          <div className="search-main">
            <div className="search-query">
              <Search size={20} />
              <label htmlFor="search" className="sr-only">
                Search provider, service or medicine
              </label>
              <input
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a provider, service, or medicine…"
              />
            </div>
            <button
              type="button"
              className={`filter-toggle ${filters ? "selected" : ""}`}
              aria-expanded={filters}
              onClick={() => setFilters(!filters)}
            >
              <SlidersHorizontal size={17} /> Filters
              {[insurance, county, maxPrice, radius].filter(Boolean).length ? (
                <span>
                  {[insurance, county, maxPrice, radius].filter(Boolean).length}
                </span>
              ) : null}
            </button>
            <button className="button primary" type="submit" disabled={loading}>
              Search <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="category-tabs" aria-label="Provider categories">
            {[
              { name: "All services", value: "", icon: LayoutGrid },
              {
                name: "Health facilities",
                value: "Hospital / clinic",
                icon: HeartPulse,
              },
              { name: "Pharmacies", value: "Pharmacy / chemist", icon: Pill },
              { name: "Agrovets", value: "Agrovet", icon: Leaf },
              { name: "Ambulances", value: "Ambulance service", icon: Truck },
              { name: "Labs", value: "Laboratory", icon: FlaskConical },
            ].map((item) => (
              <button
                type="button"
                className={category === item.value ? "active" : ""}
                key={item.name}
                onClick={() => {
                  setCategory(item.value);
                  void search(undefined, item.value);
                }}
              >
                <item.icon size={16} />
                {item.name}
              </button>
            ))}
          </div>
          {filters ? (
            <div className="filter-grid">
              <label>
                Insurance plan
                <select
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                >
                  <option value="">Any insurance / self-pay</option>
                  {["Jubilee", "SHA", "AAR", "Britam", "CIC", "Old Mutual"].map(
                    (v) => (
                      <option key={v}>{v}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                County / area
                <input
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  placeholder="e.g. Nairobi"
                  maxLength={80}
                />
              </label>
              <label>
                Maximum price (KES)
                <input
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="Any price"
                />
              </label>
              <label>
                Distance
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                >
                  <option value="">Any distance</option>
                  {[2, 5, 10, 25, 50].map((v) => (
                    <option value={v} key={v}>
                      Within {v} km
                    </option>
                  ))}
                </select>
              </label>
              <p>
                Location is optional. Distance is a straight-line estimate.
                Confirm your exact insurance plan and final price with the
                provider.
              </p>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setInsurance("");
                  setCounty("");
                  setMaxPrice("");
                  setRadius("");
                  setCoords(null);
                  setCategory("");
                  setQuery("");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : null}
        </form>
      ) : null}
      {error ? (
        <div className="notice error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="results-heading">
        <div>
          <h2>{savedOnly ? "Your shortlist" : "Explore your options"}</h2>
          <span>
            {results.length} {results.length === 1 ? "provider" : "providers"}
            {preview ? " · Sample directory" : ""}
            {coords
              ? " · Location shared"
              : " · Add location to compare distance"}
          </span>
        </div>
        <label className="sort-control">
          Sort by{" "}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              void search(undefined, undefined, e.target.value);
            }}
          >
            <option value="nearest">Nearest first</option>
            <option value="price">Lowest listed price</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>
      {loading ? (
        <div className="workspace-loading">
          <LoaderCircle className="spin" /> Finding providers…
        </div>
      ) : results.length ? (
        <div className="provider-grid">
          {results.map((p) => {
            const Icon = categoryIcon(p.category);
            const price = minPrice(p);
            return (
              <article className="provider-card" key={p.id}>
                <div className="provider-card-top">
                  <span
                    className={`provider-category-icon category-${p.category.split(" ")[0].toLowerCase()}`}
                  >
                    <Icon size={26} />
                  </span>
                  <button
                    className={`icon-button save-provider ${saved.includes(p.id) ? "is-saved" : ""}`}
                    aria-label={`${saved.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
                    aria-pressed={saved.includes(p.id)}
                    disabled={pending === p.id}
                    onClick={() => toggleSaved(p)}
                  >
                    <Bookmark
                      size={19}
                      fill={saved.includes(p.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <span className="provider-category">{p.category}</span>
                <h3>
                  <button onClick={() => setDetails(p)}>{p.name}</button>
                </h3>
                <div className="provider-address">
                  <MapPin size={13} />
                  {p.county}
                  <span>·</span>
                  {p.distance === null
                    ? "Distance unavailable"
                    : `${p.distance.toFixed(1)} km away`}
                </div>
                <div className="insurance-tags">
                  {p.insurance.length ? (
                    p.insurance
                      .slice(0, 3)
                      .map((plan) => <span key={plan}>{plan}</span>)
                  ) : (
                    <span>Ask about payment options</span>
                  )}
                </div>
                <div className="provider-card-footer">
                  <div>
                    <span>Listed starting price</span>
                    <strong>
                      {Number.isFinite(price) ? (
                        <>
                          KES {price.toLocaleString()}
                          <small> / service</small>
                        </>
                      ) : (
                        "Request a quote"
                      )}
                    </strong>
                  </div>
                  <button
                    className="connect-button"
                    disabled={pending === p.id}
                    onClick={() => connect(p)}
                    aria-label={`Connect with ${p.name}`}
                  >
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <Empty
            icon={savedOnly ? Bookmark : Search}
            title={
              savedOnly
                ? "Keep your best matches close."
                : "No matches just yet."
            }
            description={
              savedOnly
                ? "Save a provider while exploring to build your own shortlist."
                : "Try another area, insurance plan, or service. New verified providers will appear here."
            }
          />
        </section>
      )}
      <div className="discovery-footnote">
        <ShieldCheck size={16} />
        <p>
          Insurance acceptance and listed prices are provider information.
          Confirm your specific plan, coverage, service, and final price before
          travelling.
        </p>
      </div>
      {details ? (
        <Modal title="Provider details" onClose={() => setDetails(null)}>
          <div className="portfolio-detail">
            <span className="provider-category">{details.category}</span>
            <h3>{details.name}</h3>
            <p>
              <MapPin size={14} /> {details.address}
            </p>
            <h4>Insurance plans</h4>
            <div className="insurance-tags">
              {details.insurance.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
            <h4>Services & listed prices</h4>
            {details.services.map((s) => (
              <div className="service-line" key={s.name}>
                <span>{s.name}</span>
                <strong>
                  {s.price === null
                    ? "Request a quote"
                    : `KES ${s.price.toLocaleString()}`}
                </strong>
              </div>
            ))}
            <p className="small-muted">
              Confirm exact plan coverage and final charges with the provider.
              Ambulance listings are for enquiries and do not confirm dispatch.
            </p>
            <button
              className="button primary full-width"
              disabled={pending === details.id}
              onClick={() => connect(details)}
            >
              Start a conversation <MessagesSquare size={17} />
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
function PortfolioForm({
  preview,
  done,
}: {
  preview: boolean;
  done: (p: Portfolio | null, message: string) => void;
}) {
  const [category, setCategory] = useState<string>(portfolioTypes[0]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const v = Object.fromEntries(new FormData(e.currentTarget));
    const input = {
      name: String(v.name),
      category,
      county: String(v.county),
      address: String(v.address),
      phone: String(v.phone),
      registrationNumber: String(v.registrationNumber),
      insurance: String(v.insurance)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      services: v.serviceName
        ? [
            {
              name: String(v.serviceName),
              price: v.price ? Number(v.price) : null,
            },
          ]
        : [],
    };
    try {
      if (preview) {
        done(
          {
            ...input,
            id: `demo-${Date.now()}`,
            status: "DRAFT",
            created_at: new Date().toISOString(),
          },
          "Preview portfolio added. This was not saved to a database.",
        );
        return;
      }
      const result = await api<{ message: string }>("portfolios", input);
      done(null, result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="workspace-form" onSubmit={submit}>
      <p className="small-muted">
        Each portfolio represents an independent business. You can add as many
        as you manage under this account.
      </p>
      <label>
        Portfolio type
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {portfolioTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        {category.includes("Ambulance")
          ? "Ambulance company name"
          : category.includes("chemist")
            ? "Pharmacy / chemist name"
            : category === "Agrovet"
              ? "Agrovet name"
              : "Business / facility name"}
        <input
          name="name"
          required
          minLength={2}
          maxLength={150}
          placeholder="Registered business name"
        />
      </label>
      <div className="form-two-col">
        <label>
          County
          <input
            name="county"
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. Nairobi"
          />
        </label>
        <label>
          Contact number
          <input
            name="phone"
            type="tel"
            required
            pattern="\+?[\d\s()\-]{9,20}"
            placeholder="+254 7XX XXX XXX"
          />
        </label>
      </div>
      <label>
        Physical address
        <input
          name="address"
          required
          minLength={5}
          maxLength={250}
          placeholder="Building, street, and area"
        />
      </label>
      <label>
        {category.includes("Ambulance")
          ? "Operator registration number"
          : "Business registration number"}
        <input
          name="registrationNumber"
          required
          minLength={2}
          maxLength={100}
          placeholder="Registration or permit reference"
        />
      </label>
      <label>
        Accepted insurance plans <span className="optional">(optional)</span>
        <input
          name="insurance"
          placeholder="e.g. Jubilee, SHA, AAR"
          maxLength={500}
        />
        <small>Separate plans with commas. List only plans you accept.</small>
      </label>
      <div className="form-section-label">
        FIRST SERVICE <span>Optional · add more during catalogue setup</span>
      </div>
      <div className="form-two-col">
        <label>
          Service name
          <input
            name="serviceName"
            placeholder={
              category === "Agrovet"
                ? "Veterinary consultation"
                : "e.g. General consultation"
            }
            minLength={2}
            maxLength={120}
          />
        </label>
        <label>
          Starting price (KES)
          <input
            name="price"
            type="number"
            min="0"
            max="10000000"
            step="0.01"
            placeholder="Leave blank for a quote"
          />
        </label>
      </div>
      <div className="notice">
        <ShieldCheck size={17} />
        <p>
          Saved as a private draft. Verification evidence, Admin review, and
          final approval are required before publication.
        </p>
      </div>
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button primary full-width" disabled={busy}>
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <Plus size={17} />
        )}{" "}
        Save portfolio draft
      </button>
    </form>
  );
}
function InviteAdmin({
  preview,
  done,
}: {
  preview: boolean;
  done: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="workspace-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const input = Object.fromEntries(new FormData(e.currentTarget));
        try {
          if (preview) {
            done("Preview only. No admin was created or emailed.");
            return;
          }
          const result = await api<{ message: string }>("admins", input);
          done(result.message);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="small-muted">
        Create an admin account. Pinna will email a temporary password; the
        recipient must change it and set up two-step verification at first
        sign-in.
      </p>
      <label>
        Full name
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          placeholder="Admin’s full name"
        />
      </label>
      <label>
        Email address
        <input
          name="email"
          required
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
        />
      </label>
      <div className="notice">
        <ShieldCheck size={17} />
        <p>
          This invitation grants Admin access. Only the seeded Super Admin can
          create admins.
        </p>
      </div>
      {error ? (
        <p className="notice error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button primary full-width" disabled={busy}>
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <Mail size={17} />
        )}{" "}
        Create & email admin
      </button>
    </form>
  );
}
function AdminTeam({
  data,
  onInvite,
}: {
  data: DashboardData;
  onInvite: () => void;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Platform administrators</h2>
          <p>Admin access is issued by the platform owner.</p>
        </div>
        <span className="count-tag">{data.admins.length} admins</span>
      </div>
      {data.admins.length ? (
        <div className="portfolio-list">
          {data.admins.map((a) => (
            <div className="portfolio-row" key={a.id}>
              <div className="avatar">
                {a.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="portfolio-row-name">
                <strong>{a.name}</strong>
                <span>{a.email}</span>
              </div>
              <span className="status-badge">
                <span />
                {a.must_change_password
                  ? "Security setup pending"
                  : "Account activated"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          icon={Users}
          title="Build your admin team."
          description="Invite the people who will help review applications and manage the platform."
          action={
            <button className="button primary" onClick={onInvite}>
              <Plus size={16} /> Invite admin
            </button>
          }
        />
      )}
    </section>
  );
}
function Account({ user, preview }: { user: User; preview: boolean }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR ACCOUNT</div>
          <h1>A little about you.</h1>
          <p>Your identity and security, in one place.</p>
        </div>
      </div>
      <section className="panel account-panel">
        <div className="account-identity">
          <div className="avatar large-avatar">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </div>
        <dl>
          <div>
            <dt>Account type</dt>
            <dd>
              {user.role === "SUPER_ADMIN"
                ? "Super Admin"
                : user.role === "ADMIN"
                  ? "Administrator"
                  : user.role === "BUSINESS"
                    ? "Bismart Business"
                    : "Personal account"}
            </dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>
              <ShieldCheck size={16} /> Assigned securely to your account
            </dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>Shared only when you choose to search nearby</dd>
          </div>
        </dl>
        <div className="account-security">
          <LockKeyhole size={21} />
          <div>
            <h3>Keep your account secure.</h3>
            <p>
              {user.mfaEnrolled
                ? "Your account is protected by an authenticator."
                : "Use a unique password and keep access to your email private."}
            </p>
          </div>
          {!preview ? (
            <Link className="button secondary" href="/forgot-password">
              Reset password <ArrowUpRight size={15} />
            </Link>
          ) : null}
        </div>
      </section>
    </>
  );
}
function Messages({
  user,
  data,
  preview,
  notify,
}: {
  user: User;
  data: DashboardData;
  preview: boolean;
  notify: (s: string) => void;
}) {
  const [active, setActive] = useState(data.conversations[0]?.id ?? ""),
    [messages, setMessages] = useState<Message[]>(() =>
      preview
        ? [
            {
              id: "demo-message",
              sender_id: user.role === "USER" ? user.id : "preview-customer",
              body: "Hello, do you accept my Jubilee plan for a consultation?",
              created_at: "2026-11-09T08:30:00Z",
            },
          ]
        : [],
    ),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    let live = true;
    if (!active || preview) return;
    api<{ messages: Message[] }>(`conversations/${active}`)
      .then((r) => {
        if (live) setMessages(r.messages);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [active, preview]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (!preview) await api(`conversations/${active}`, { message: text });
      setMessages((m) => [
        ...m,
        {
          id: `${Date.now()}`,
          sender_id: user.id,
          body: text.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setText("");
      if (preview) notify("Preview message only. Nothing was sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }
  const conversation = data.conversations.find((c) => c.id === active);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KEEP THE CONVERSATION GOING</div>
          <h1>Your connections.</h1>
          <p>Ask about services, confirm coverage, and plan your next step.</p>
        </div>
      </div>
      <div className="messages-panel panel">
        <aside className="conversation-list">
          <div className="conversation-heading">
            Messages <span>{data.conversations.length}</span>
          </div>
          {data.conversations.length ? (
            data.conversations.map((c) => (
              <button
                className={`conversation-item ${active === c.id ? "active" : ""}`}
                disabled={busy}
                key={c.id}
                onClick={() => {
                  if (active !== c.id) {
                    setMessages([]);
                    setError("");
                    setLoading(!preview);
                    setActive(c.id);
                  }
                }}
              >
                <div className="avatar">
                  {
                    (user.role === "BUSINESS"
                      ? c.customer_name
                      : c.provider_name)[0]
                  }
                </div>
                <div>
                  <strong>
                    {user.role === "BUSINESS"
                      ? c.customer_name
                      : c.provider_name}
                  </strong>
                  <p>{c.last_message ?? "Start a conversation"}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="subtle-empty">No conversations yet.</p>
          )}
        </aside>
        <section className="chat-area">
          {active ? (
            <>
              <div className="chat-header">
                <div className="avatar">
                  <MessagesSquare size={18} />
                </div>
                <div>
                  <strong>
                    {user.role === "BUSINESS"
                      ? conversation?.customer_name
                      : conversation?.provider_name}
                  </strong>
                  <span>Direct conversation</span>
                </div>
                {!preview ? (
                  <button
                    className="text-link"
                    onClick={async () => {
                      setError("");
                      try {
                        setMessages(
                          (
                            await api<{ messages: Message[] }>(
                              `conversations/${active}`,
                            )
                          ).messages,
                        );
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Could not refresh messages.",
                        );
                      }
                    }}
                  >
                    Refresh
                  </button>
                ) : null}
              </div>
              <div className="chat-notice">
                <LockKeyhole size={12} /> Share only the information needed for
                your enquiry.
              </div>
              <div
                className="chat-messages"
                role="log"
                aria-label="Conversation messages"
              >
                {loading ? (
                  <LoaderCircle className="spin" />
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`message ${m.sender_id === user.id ? "outgoing" : "incoming"}`}
                    >
                      <p>{m.body}</p>
                      <time>
                        {new Intl.DateTimeFormat("en-KE", {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "Africa/Nairobi",
                        }).format(new Date(m.created_at))}
                      </time>
                    </div>
                  ))
                )}
              </div>
              {error ? (
                <div className="notice error" role="alert">
                  {error}
                </div>
              ) : null}
              <form className="chat-composer" onSubmit={send}>
                <label htmlFor="message" className="sr-only">
                  Your message
                </label>
                <input
                  id="message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a message…"
                  required
                  maxLength={3000}
                />
                <button
                  className="button primary"
                  disabled={busy || loading || !text.trim()}
                  aria-label="Send message"
                >
                  {busy ? (
                    <LoaderCircle size={17} className="spin" />
                  ) : (
                    <Send size={17} />
                  )}
                </button>
              </form>
            </>
          ) : (
            <Empty
              icon={MessagesSquare}
              title="A connection starts with hello."
              description="Find a provider and start a conversation to see it here."
            />
          )}
        </section>
      </div>
    </>
  );
}
