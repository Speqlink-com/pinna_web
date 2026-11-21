"use client";
import { LocationMap } from "./location-map";
import { LocationOperations } from "./location-operations";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Plus,
  ArrowLeft,
  ArrowUpRight,
  FileCheck2,
  ShieldCheck,
  Clock,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Trash2,
  Save,
  Send,
  Archive,
  RefreshCw,
  ChevronRight,
  BriefcaseBusiness,
} from "lucide-react";
import { api } from "@/lib/api";
import { PremiumIcon } from "./premium-icon";
import type {
  BusinessProfile,
  ClientDetail,
  ClientOptions,
  ClientPortfolio,
  ClientWorkspaceProps,
  Evidence,
  OpeningHours,
  PortfolioForm,
} from "@/lib/client-types";
const labels: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Awaiting Admin review",
  ADMIN_RECOMMENDED: "Awaiting final approval",
  APPROVED: "Published",
  CHANGES_REQUESTED: "Changes requested",
};
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const date = (value: string) =>
  new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
function empty(profile: BusinessProfile | null): PortfolioForm {
  return {
    name: "",
    category: "Hospital / clinic",
    county: profile?.county ?? "",
    address: profile?.address ?? "",
    phone: profile?.contactPhone ?? "",
    registrationNumber: profile?.registrationNumber ?? "",
    description: "",
    licensingAuthority: "",
    licenseNumber: "",
    insurance: [],
    services: [],
    latitude: null,
    longitude: null,
    categoryDetails: {},
    openingHours: days.map((_, day) => ({
      day,
      closed: day === 6,
      allDay: false,
      opens: "09:00",
      closes: "17:00",
      overnight: false,
    })),
    revision: 0,
  };
}
function normalize(p: ClientPortfolio): PortfolioForm {
  return {
    name: p.name,
    category: p.category,
    county: p.county,
    address: p.address,
    phone: p.phone,
    registrationNumber: p.registration_number,
    description: p.description,
    licensingAuthority: p.licensing_authority,
    licenseNumber: p.license_number,
    insurance: p.insurance,
    services: p.services.map((s) => ({
      ...s,
      price: s.price === null ? null : Number(s.price),
      priceType: s.priceType ?? (s.price === null ? "quote" : "fixed"),
    })),
    latitude: p.latitude,
    longitude: p.longitude,
    categoryDetails: p.category_details,
    openingHours:
      p.opening_hours.length === 7 ? p.opening_hours : empty(null).openingHours,
    revision: p.revision,
  };
}
function Status({ p }: { p: ClientPortfolio }) {
  return (
    <span
      className={`client-status ${p.archived_at ? "archived" : p.status.toLowerCase()}`}
    >
      {p.archived_at ? "Archived" : labels[p.status]}
    </span>
  );
}
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="client-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function ClientWorkspace({ user }: ClientWorkspaceProps) {
  const business = user.role === "BUSINESS";
  const router = useRouter();
  const params = useSearchParams();
  const create = params.get("create") === "1";
  const rawPortfolio = params.get("portfolio") ?? "";
  const requestedPortfolio = /^[a-f0-9-]{36}$/i.test(rawPortfolio)
    ? rawPortfolio
    : "";
  const requestedTab = params.get("tab") ?? "details";
  const initialQuery = (params.get("q") ?? "").slice(0, 100);
  const [options, setOptions] = useState<ClientOptions | null>(null),
    [profile, setProfile] = useState<BusinessProfile | null>(null),
    [list, setList] = useState<ClientPortfolio[]>([]),
    [counts, setCounts] = useState<Record<string, number>>({}),
    [offset, setOffset] = useState(0),
    [next, setNext] = useState<number | null>(null),
    [status, setStatus] = useState(
      [
        "DRAFT",
        "SUBMITTED",
        "ADMIN_RECOMMENDED",
        "APPROVED",
        "CHANGES_REQUESTED",
      ].includes(params.get("status") ?? "")
        ? params.get("status")!
        : business
          ? ""
          : "SUBMITTED",
    ),
    [archived, setArchived] = useState(false),
    [search, setSearch] = useState(initialQuery),
    [query, setQuery] = useState(initialQuery),
    [pane, setPane] = useState(
      params.get("view") === "profile" ? "profile" : "portfolios",
    ),
    [tab, setTab] = useState("details"),
    [detail, setDetail] = useState<ClientDetail | null>(null),
    [form, setForm] = useState<PortfolioForm | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [reviewNote, setReviewNote] = useState(""),
    [reviewed, setReviewed] = useState<string[]>([]),
    [downloaded, setDownloaded] = useState<string[]>([]),
    [pending, setPending] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = Boolean(
    form &&
    (detail
      ? JSON.stringify(form) !== JSON.stringify(normalize(detail.portfolio))
      : form.name.trim()),
  );
  function leaveEditor() {
    if (
      dirty &&
      !window.confirm("Leave this portfolio without saving your changes?")
    )
      return;
    setForm(null);
    setDetail(null);
    if (business && requestedPortfolio)
      router.replace("/dashboard/portfolios", { scroll: false });
    setPending("");
    setError("");
  }
  const path = () =>
    `portfolios?offset=${offset}&archived=${archived}${status ? `&status=${status}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
  useEffect(() => {
    let active = true;
    Promise.all([
      api<ClientOptions>("portfolios/options"),
      business
        ? api<{ profile: BusinessProfile | null }>("client/profile")
        : Promise.resolve({ profile: null }),
      requestedPortfolio
        ? api<ClientDetail>(`portfolios/${requestedPortfolio}`)
        : Promise.resolve(null),
    ])
      .then(([o, p, selected]) => {
        if (active) {
          setOptions(o);
          setProfile(p.profile);
          if (selected && !create) {
            setDetail(selected);
            setForm(normalize(selected.portfolio));
            const tabs = [
              "details",
              "services",
              "location",
              "documents",
              "history",
              ...(business ? ["operations"] : []),
            ];
            setTab(tabs.includes(requestedTab) ? requestedTab : "details");
          }
          if (business && create) {
            setDetail(null);
            setForm(empty(p.profile));
            setTab("details");
            router.replace("/dashboard/portfolios", { scroll: false });
          }
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [business, create, router, requestedPortfolio, requestedTab]);
  useEffect(() => {
    let active = true;
    const url = `portfolios?offset=${offset}&archived=${archived}${status ? `&status=${status}` : ""}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
    api<{
      portfolios: ClientPortfolio[];
      counts: Record<string, number>;
      nextOffset: number | null;
    }>(url)
      .then((r) => {
        if (active) {
          setList(r.portfolios);
          setCounts(r.counts);
          setNext(r.nextOffset);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [offset, status, archived, query]);
  async function refresh() {
    const r = await api<{
      portfolios: ClientPortfolio[];
      counts: Record<string, number>;
      nextOffset: number | null;
    }>(path());
    setList(r.portfolios);
    setCounts(r.counts);
    setNext(r.nextOffset);
  }
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The request could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function open(id: string) {
    const result = await api<ClientDetail>(`portfolios/${id}`);
    setDetail(result);
    setForm(normalize(result.portfolio));
    setReviewed([]);
    setDownloaded([]);
    setReviewNote("");
    setPending("");
  }
  async function persist() {
    if (!form) throw new Error("Choose a portfolio.");
    const { revision, ...draft } = form;
    draft.insurance = draft.insurance.filter((x) => x.trim());
    draft.categoryDetails = Object.fromEntries(
      Object.entries(draft.categoryDetails).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.filter((x) => x.trim()) : v,
      ]),
    );
    const result = await api<{ portfolio: ClientPortfolio; message: string }>(
      detail ? `portfolios/${detail.portfolio.id}` : "portfolios",
      detail ? { ...draft, revision } : draft,
    );
    await open(result.portfolio.id);
    await refresh();
    return result.portfolio;
  }
  function patch<K extends keyof PortfolioForm>(
    key: K,
    value: PortfolioForm[K],
  ) {
    setForm((previous) => (previous ? { ...previous, [key]: value } : null));
  }
  const editable =
    business &&
    !detail?.portfolio.archived_at &&
    (!detail ||
      ["DRAFT", "CHANGES_REQUESTED"].includes(detail.portfolio.status));
  async function download(doc: Evidence) {
    const response = await fetch(
      `/api/v1/portfolios/${detail!.portfolio.id}/documents/${doc.id}/download`,
      {
        cache: "no-store",
        credentials: "same-origin",
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => ({ error: "Download failed." }));
      throw new Error(data.error);
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded((value) => [...new Set([...value, doc.id])]);
  }
  async function action(actionName: string) {
    if (!detail) return;
    await api(`portfolios/${detail.portfolio.id}/action/${actionName}`, {
      revision: detail.portfolio.revision,
      note: reviewNote,
    });
    await open(detail.portfolio.id);
    await refresh();
    setMessage("Portfolio access updated.");
  }
  async function decision(value: string) {
    if (!detail) return;
    await api(`portfolios/${detail.portfolio.id}/review/${value}`, {
      revision: detail.portfolio.revision,
      note: reviewNote,
      checked: true,
      reviewedDocumentIds: reviewed,
    });
    await open(detail.portfolio.id);
    await refresh();
    setMessage("Review decision saved and the business owner notified.");
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="client-module">
      <div className="client-page-heading">
        <div>
          <span className="eyebrow">
            {business ? "YOUR BUSINESS NETWORK" : "PROVIDER VERIFICATION"}
          </span>
          <h1>
            {form
              ? detail
                ? detail.portfolio.name
                : "Register a business location"
              : business
                ? "Your businesses."
                : "Review the provider network."}
          </h1>
          <p>
            {form
              ? "Keep each service location, offering and verification record in one place."
              : business
                ? "Register each business or branch with its own location. Complete the profile and evidence, then submit it for pinnaa approval."
                : "Check the evidence, record your decision, and keep listings current."}
          </p>
        </div>
        {!form && business && pane === "portfolios" && (
          <button
            className="button primary"
            disabled={!options || busy}
            onClick={() => {
              setForm(empty(profile));
              setDetail(null);
              setTab("details");
              setMessage("");
              setError("");
            }}
          >
            <PremiumIcon name="add" size={23} /> Register business location
          </button>
        )}
        {form && (
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              leaveEditor();
            }}
          >
            <ArrowLeft size={17} /> All portfolios
          </button>
        )}
      </div>
      {error && (
        <div className="notice error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}
      {!form && (
        <>
          <div className="client-metrics">
            {[
              ["Portfolios", total],
              ["Published", counts.APPROVED ?? 0],
              [
                "In review",
                (counts.SUBMITTED ?? 0) + (counts.ADMIN_RECOMMENDED ?? 0),
              ],
              [
                "Need attention",
                (counts.CHANGES_REQUESTED ?? 0) + (counts.DRAFT ?? 0),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          {business && (
            <div className="client-primary-tabs">
              <button
                className={pane === "portfolios" ? "active" : ""}
                onClick={() => setPane("portfolios")}
              >
                <Building2 size={17} /> Business locations
              </button>
              <button
                className={pane === "profile" ? "active" : ""}
                onClick={() => setPane("profile")}
              >
                <BriefcaseBusiness size={17} /> Business profile{" "}
                {!profile && <span className="client-dot" />}
              </button>
            </div>
          )}
          {business && pane === "profile" ? (
            <BusinessProfileForm
              key={profile?.revision ?? 0}
              initial={profile}
              userName={user.name}
              email={user.email}
              onSave={(value) =>
                run(async () => {
                  const result = await api<{
                    profile: BusinessProfile;
                    message: string;
                  }>("client/profile", value);
                  setProfile(result.profile);
                  setMessage(result.message);
                })
              }
              busy={busy}
            />
          ) : (
            <>
              {business && !profile && (
                <div className="client-onboarding-callout">
                  <ShieldCheck size={24} />
                  <div>
                    <strong>Start with your business identity.</strong>
                    <p>
                      Complete your owner profile, register each business
                      location, add its map pin, services and evidence, then
                      submit it for pinnaa review. Each location is approved
                      separately.
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => setPane("profile")}
                  >
                    Complete profile <ChevronRight size={16} />
                  </button>
                </div>
              )}
              <section className="panel client-list-panel">
                <div className="client-list-toolbar">
                  <div className="client-filters">
                    <label>
                      <span className="sr-only">Portfolio status</span>
                      <select
                        value={archived ? "ARCHIVED" : status}
                        onChange={(e) => {
                          setArchived(e.target.value === "ARCHIVED");
                          setStatus(
                            e.target.value === "ARCHIVED" ? "" : e.target.value,
                          );
                          setOffset(0);
                          setLoading(true);
                        }}
                      >
                        <option value="">All portfolios</option>
                        {Object.entries(labels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </label>
                  </div>
                  <form
                    className="client-search"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setQuery(search);
                      setOffset(0);
                      setLoading(true);
                    }}
                  >
                    <PremiumIcon name="search" size={19} />
                    <input
                      aria-label="Search portfolios"
                      placeholder="Search name or county"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      maxLength={100}
                    />
                    <button className="button secondary" type="submit">
                      Search
                    </button>
                  </form>
                </div>
                {loading ? (
                  <div className="client-empty">
                    <LoaderCircle className="spin" /> Loading portfolios…
                  </div>
                ) : list.length ? (
                  <div className="client-portfolio-grid">
                    {list.map((p) => (
                      <article className="client-portfolio-card" key={p.id}>
                        <div className="client-card-top">
                          <span className="client-category-icon">
                            <Building2 size={24} />
                          </span>
                          <Status p={p} />
                        </div>
                        <span className="client-category">{p.category}</span>
                        <h2>{p.name}</h2>
                        <p className="client-card-location">
                          <PremiumIcon name="location" size={19} />
                          {p.county || "Location needed"}
                          {p.address && ` · ${p.address}`}
                        </p>
                        {!business && (
                          <p className="client-owner">
                            {p.owner_name} · {p.owner_email}
                          </p>
                        )}
                        <p className="client-card-description">
                          {p.description ||
                            "Add the services, location and documents for this portfolio."}
                        </p>
                        <div className="client-card-facts">
                          <span>{p.services.length} services</span>
                          <span>
                            {p.insurance.length
                              ? `${p.insurance.length} insurance plans`
                              : "Self-pay / no plans listed"}
                          </span>
                        </div>
                        {p.review_note && (
                          <div className="client-review-note">
                            <FileCheck2 size={16} />
                            <span>{p.review_note}</span>
                          </div>
                        )}
                        {p.verification_expires_on && (
                          <p className="client-expiry">
                            <Clock size={14} /> Verified through{" "}
                            {date(p.verification_expires_on)}
                          </p>
                        )}
                        <button
                          className="button secondary full-width"
                          disabled={busy}
                          onClick={() =>
                            run(async () => {
                              await open(p.id);
                              setTab("details");
                            })
                          }
                        >
                          {business ? "Manage business" : "Review portfolio"}
                          <ArrowUpRight size={17} />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="client-empty">
                    <Building2 size={32} />
                    <h2>
                      {business
                        ? "Your next connection starts here."
                        : "No portfolios in this queue."}
                    </h2>
                    <p>
                      {business
                        ? "Add a service location, set its offerings and prices, then submit it for verification."
                        : "Submitted portfolios will appear when a business is ready for review."}
                    </p>
                  </div>
                )}
                <div className="client-pagination">
                  <span>
                    {list.length
                      ? `${offset + 1}–${offset + list.length}`
                      : "0"}{" "}
                    shown
                  </span>
                  <div>
                    {offset > 0 && (
                      <button
                        className="button secondary"
                        onClick={() => {
                          setOffset(offset - 50);
                          setLoading(true);
                        }}
                      >
                        Previous
                      </button>
                    )}
                    {next !== null && (
                      <button
                        className="button secondary"
                        onClick={() => {
                          setOffset(next);
                          setLoading(true);
                        }}
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}
      {form && (
        <>
          {detail && (
            <div className="client-editor-summary">
              <Status p={detail.portfolio} />
              <span>Revision {detail.portfolio.revision}</span>
              {detail.portfolio.verification_expires_on && (
                <span>
                  Verification expires{" "}
                  {date(detail.portfolio.verification_expires_on)}
                </span>
              )}
              <button
                className="text-link"
                disabled={busy}
                onClick={() => run(() => open(detail.portfolio.id))}
              >
                <RefreshCw size={14} /> Reload saved version
              </button>
            </div>
          )}
          {detail?.portfolio.review_note && (
            <div className="notice client-latest-note">
              <strong>Latest review note</strong>
              <p>{detail.portfolio.review_note}</p>
            </div>
          )}
          <div className="client-editor-layout">
            <nav className="client-editor-nav" aria-label="Portfolio sections">
              {[
                ["details", "Portfolio details"],
                ["services", "Services & insurance"],
                ["location", "Location & hours"],
                ["documents", "Verification documents"],
                ["history", "Review history"],
                ...(business && detail
                  ? [["operations", "Availability & stock"]]
                  : []),
              ].map(([key, label], index) => (
                <button
                  key={key}
                  className={tab === key ? "active" : ""}
                  onClick={() => setTab(key)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {label}
                </button>
              ))}
            </nav>
            <div className="client-editor-content">
              <form
                ref={formRef}
                className="panel client-editor-panel"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await persist();
                    setMessage("Portfolio saved.");
                  });
                }}
              >
                {tab === "details" && (
                  <>
                    <SectionTitle
                      eyebrow="01 / IDENTITY"
                      title="Introduce this portfolio"
                      description="Use the trading name and registration details for this service location."
                    />
                    <fieldset
                      disabled={!editable || busy}
                      className="client-fields"
                    >
                      <Field label="Portfolio name">
                        <input
                          value={form.name}
                          onChange={(e) => patch("name", e.target.value)}
                          minLength={2}
                          maxLength={150}
                          required
                          placeholder="e.g. Westlands Care Clinic"
                        />
                      </Field>
                      <Field label="Service category">
                        <select
                          value={form.category}
                          onChange={(e) => {
                            patch("category", e.target.value);
                            patch("categoryDetails", {});
                          }}
                        >
                          {Object.keys(options?.categories ?? {}).map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Registration number">
                        <input
                          value={form.registrationNumber}
                          maxLength={100}
                          onChange={(e) =>
                            patch("registrationNumber", e.target.value)
                          }
                        />
                      </Field>
                      <Field
                        label="Contact phone"
                        hint="Use international format, for example +254712345678."
                      >
                        <input
                          type="tel"
                          value={form.phone}
                          maxLength={30}
                          onChange={(e) => patch("phone", e.target.value)}
                        />
                      </Field>
                      <Field label="Licensing / authorising body">
                        <input
                          value={form.licensingAuthority}
                          maxLength={150}
                          onChange={(e) =>
                            patch("licensingAuthority", e.target.value)
                          }
                          placeholder="Name of the issuing authority"
                        />
                      </Field>
                      <Field label="Licence / authorisation number">
                        <input
                          value={form.licenseNumber}
                          maxLength={100}
                          onChange={(e) =>
                            patch("licenseNumber", e.target.value)
                          }
                        />
                      </Field>
                      <div className="client-field-wide">
                        <Field
                          label="About this portfolio"
                          hint="Use at least 40 characters before submitting for review."
                        >
                          <textarea
                            value={form.description}
                            onChange={(e) =>
                              patch("description", e.target.value)
                            }
                            maxLength={2000}
                            rows={4}
                            placeholder="Describe your services, facilities and who you serve."
                          />
                        </Field>
                      </div>
                    </fieldset>
                    <h3 className="client-subheading">
                      {form.category} details
                    </h3>
                    <fieldset
                      disabled={!editable || busy}
                      className="client-fields"
                    >
                      {options?.categories[form.category]?.map((field) => (
                        <Field
                          key={field.key}
                          label={field.label}
                          hint={
                            field.type === "list"
                              ? "Separate items with commas."
                              : undefined
                          }
                        >
                          {field.type === "boolean" ? (
                            <select
                              value={
                                form.categoryDetails[field.key] === undefined
                                  ? ""
                                  : String(form.categoryDetails[field.key])
                              }
                              onChange={(e) =>
                                patch("categoryDetails", {
                                  ...form.categoryDetails,
                                  [field.key]: e.target.value === "true",
                                })
                              }
                            >
                              <option value="" disabled>
                                Choose an option
                              </option>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          ) : field.type === "select" ? (
                            <select
                              value={String(
                                form.categoryDetails[field.key] ?? "",
                              )}
                              onChange={(e) =>
                                patch("categoryDetails", {
                                  ...form.categoryDetails,
                                  [field.key]: e.target.value,
                                })
                              }
                            >
                              <option value="" disabled>
                                Choose an option
                              </option>
                              {field.options?.map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              min={field.type === "number" ? 1 : undefined}
                              max={field.type === "number" ? 500 : undefined}
                              value={
                                Array.isArray(form.categoryDetails[field.key])
                                  ? (
                                      form.categoryDetails[
                                        field.key
                                      ] as string[]
                                    ).join(", ")
                                  : String(
                                      form.categoryDetails[field.key] ?? "",
                                    )
                              }
                              maxLength={field.type === "list" ? 2000 : 500}
                              onChange={(e) =>
                                patch("categoryDetails", {
                                  ...form.categoryDetails,
                                  [field.key]:
                                    field.type === "list"
                                      ? e.target.value
                                          .split(",")
                                          .map((v) => v.trim())
                                      : field.type === "number"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                })
                              }
                            />
                          )}
                        </Field>
                      ))}
                    </fieldset>
                  </>
                )}
                {tab === "services" && (
                  <>
                    <SectionTitle
                      eyebrow="02 / OFFERINGS"
                      title="Help customers compare"
                      description="List the services or products available at this location. Prices are in Kenyan shillings."
                    />
                    <fieldset disabled={!editable || busy}>
                      <div className="client-services">
                        {form.services.map((service, index) => (
                          <div className="client-service-row" key={index}>
                            <Field label={`Service ${index + 1}`}>
                              <input
                                value={service.name}
                                minLength={2}
                                maxLength={100}
                                placeholder="e.g. Consultation or medicine name"
                                onChange={(e) =>
                                  patch(
                                    "services",
                                    form.services.map((s, i) =>
                                      i === index
                                        ? { ...s, name: e.target.value }
                                        : s,
                                    ),
                                  )
                                }
                              />
                            </Field>
                            <Field label="Offering type">
                              <select
                                value={service.kind ?? "service"}
                                onChange={(e) =>
                                  patch(
                                    "services",
                                    form.services.map((s, i) =>
                                      i === index
                                        ? {
                                            ...s,
                                            kind: e.target.value as
                                              "service" | "product",
                                          }
                                        : s,
                                    ),
                                  )
                                }
                              >
                                <option value="service">Service</option>
                                <option value="product">Product</option>
                              </select>
                            </Field>
                            <Field label="Price basis">
                              <select
                                value={service.priceType}
                                onChange={(e) =>
                                  patch(
                                    "services",
                                    form.services.map((s, i) =>
                                      i === index
                                        ? {
                                            ...s,
                                            priceType: e.target
                                              .value as typeof s.priceType,
                                            price:
                                              e.target.value === "quote"
                                                ? null
                                                : s.price,
                                          }
                                        : s,
                                    ),
                                  )
                                }
                              >
                                <option value="fixed">Fixed price</option>
                                <option value="from">From</option>
                                <option value="quote">On request</option>
                              </select>
                            </Field>
                            <Field label="KES">
                              <input
                                type="number"
                                min={0}
                                max={100000000}
                                step="0.01"
                                disabled={
                                  service.priceType === "quote" ||
                                  !editable ||
                                  busy
                                }
                                value={service.price ?? ""}
                                onChange={(e) =>
                                  patch(
                                    "services",
                                    form.services.map((s, i) =>
                                      i === index
                                        ? {
                                            ...s,
                                            price:
                                              e.target.value === ""
                                                ? null
                                                : Number(e.target.value),
                                          }
                                        : s,
                                    ),
                                  )
                                }
                              />
                            </Field>
                            {editable && (
                              <button
                                className="icon-button"
                                type="button"
                                aria-label={`Remove service ${index + 1}`}
                                onClick={() =>
                                  patch(
                                    "services",
                                    form.services.filter((_, i) => i !== index),
                                  )
                                }
                              >
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {editable && (
                        <button
                          className="button secondary"
                          type="button"
                          disabled={form.services.length >= 100}
                          onClick={() =>
                            patch("services", [
                              ...form.services,
                              { name: "", price: null, priceType: "quote" },
                            ])
                          }
                        >
                          <Plus size={16} /> Add service or product
                        </button>
                      )}
                      <div className="client-subsection">
                        <Field
                          label="Accepted insurance plans"
                          hint="Separate exact plan names with commas. Leave empty if this location is self-pay only."
                        >
                          <textarea
                            rows={3}
                            value={form.insurance.join(", ")}
                            maxLength={5000}
                            onChange={(e) =>
                              patch(
                                "insurance",
                                e.target.value.split(",").map((s) => s.trim()),
                              )
                            }
                            placeholder="e.g. Jubilee, SHA"
                          />
                        </Field>
                      </div>
                    </fieldset>
                  </>
                )}
                {tab === "operations" && detail && (
                  <LocationOperations
                    id={detail.portfolio.id}
                    onSaved={async () => {
                      await open(detail.portfolio.id);
                      await refresh();
                    }}
                  />
                )}
                {tab === "location" && (
                  <>
                    <SectionTitle
                      eyebrow="03 / FINDABILITY"
                      title="Make it easy to find you"
                      description="Use the actual service location so customers can compare distance and price."
                    />
                    <LocationMap
                      picking
                      disabled={!editable || busy}
                      point={
                        form.latitude !== null && form.longitude !== null
                          ? { lat: form.latitude, lng: form.longitude }
                          : null
                      }
                      onPick={(point, address) => {
                        setForm((previous) =>
                          previous
                            ? {
                                ...previous,
                                latitude: point.lat,
                                longitude: point.lng,
                                ...(address
                                  ? { address: address.slice(0, 300) }
                                  : {}),
                              }
                            : null,
                        );
                      }}
                    />
                    <fieldset disabled={!editable || busy}>
                      <div className="client-fields">
                        <Field label="County">
                          <input
                            value={form.county}
                            maxLength={100}
                            onChange={(e) => patch("county", e.target.value)}
                          />
                        </Field>
                        <Field label="Physical address">
                          <input
                            value={form.address}
                            maxLength={300}
                            onChange={(e) => patch("address", e.target.value)}
                            placeholder="Building, road and area"
                          />
                        </Field>
                        <Field label="Latitude">
                          <input
                            type="number"
                            min={-90}
                            max={90}
                            step="any"
                            value={form.latitude ?? ""}
                            onChange={(e) =>
                              patch(
                                "latitude",
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                              )
                            }
                          />
                        </Field>
                        <Field label="Longitude">
                          <input
                            type="number"
                            min={-180}
                            max={180}
                            step="any"
                            value={form.longitude ?? ""}
                            onChange={(e) =>
                              patch(
                                "longitude",
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                              )
                            }
                          />
                        </Field>
                      </div>
                      {editable && (
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => {
                            setError("");
                            navigator.geolocation.getCurrentPosition(
                              (p) => {
                                patch(
                                  "latitude",
                                  Number(p.coords.latitude.toFixed(6)),
                                );
                                patch(
                                  "longitude",
                                  Number(p.coords.longitude.toFixed(6)),
                                );
                                setMessage(
                                  "Location filled. Confirm it is the provider's actual service location before saving.",
                                );
                              },
                              () =>
                                setError(
                                  "Location could not be accessed. Enter the coordinates manually.",
                                ),
                              { enableHighAccuracy: true, timeout: 12000 },
                            );
                          }}
                        >
                          <PremiumIcon name="location" size={21} /> Use my
                          current location
                        </button>
                      )}
                      <h3 className="client-subheading">Opening hours</h3>
                      <div className="client-hours">
                        {form.openingHours.map((hours, index) => (
                          <HoursRow
                            key={hours.day}
                            hours={hours}
                            disabled={!editable || busy}
                            onChange={(value) =>
                              patch(
                                "openingHours",
                                form.openingHours.map((h, i) =>
                                  i === index ? value : h,
                                ),
                              )
                            }
                          />
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}
                {tab === "documents" && (
                  <>
                    <SectionTitle
                      eyebrow="04 / VERIFICATION"
                      title="Evidence stays private"
                      description="Upload a registration certificate and a current operating licence or service authorisation. Only your business and pinnaa reviewers can download these documents."
                    />
                    {detail ? (
                      <>
                        <div className="client-evidence-list">
                          {detail.documents.map((doc) => (
                            <article key={doc.id} className="client-evidence">
                              <div className="client-evidence-heading">
                                <FileCheck2 size={22} />
                                <div>
                                  <strong>{doc.filename}</strong>
                                  <p>
                                    {doc.kind} ·{" "}
                                    {(doc.byte_size / 1024).toFixed(0)} KB
                                  </p>
                                </div>
                              </div>
                              <dl>
                                <div>
                                  <dt>Document no.</dt>
                                  <dd>{doc.document_number}</dd>
                                </div>
                                <div>
                                  <dt>Issued by</dt>
                                  <dd>{doc.issuing_authority}</dd>
                                </div>
                                <div>
                                  <dt>Expiry</dt>
                                  <dd>
                                    {doc.expires_on
                                      ? date(doc.expires_on)
                                      : "Not specified"}
                                  </dd>
                                </div>
                              </dl>
                              <div className="client-inline-actions">
                                <button
                                  className="button secondary"
                                  type="button"
                                  disabled={busy}
                                  onClick={() => run(() => download(doc))}
                                >
                                  <Download size={15} /> Download
                                </button>
                                {editable && (
                                  <button
                                    className="button secondary"
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      run(async () => {
                                        await api(
                                          `portfolios/${detail.portfolio.id}/documents/${doc.id}/remove`,
                                          {
                                            revision: detail.portfolio.revision,
                                          },
                                        );
                                        await open(detail.portfolio.id);
                                        setMessage(
                                          "Document removed from the draft.",
                                        );
                                      })
                                    }
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              {!business &&
                                ["SUBMITTED", "ADMIN_RECOMMENDED"].includes(
                                  detail.portfolio.status,
                                ) && (
                                  <label className="client-check">
                                    <input
                                      type="checkbox"
                                      disabled={!downloaded.includes(doc.id)}
                                      checked={reviewed.includes(doc.id)}
                                      onChange={(e) =>
                                        setReviewed(
                                          e.target.checked
                                            ? [...reviewed, doc.id]
                                            : reviewed.filter(
                                                (id) => id !== doc.id,
                                              ),
                                        )
                                      }
                                    />{" "}
                                    I downloaded and reviewed this document
                                  </label>
                                )}
                            </article>
                          ))}
                        </div>
                        {editable && (
                          <EvidenceUpload
                            options={options}
                            portfolio={detail.portfolio}
                            disabled={busy}
                            upload={(file, metadata) =>
                              run(async () => {
                                const saved = await persist();
                                const response = await fetch(
                                  `/api/v1/portfolios/${saved.id}/documents/upload`,
                                  {
                                    method: "POST",
                                    credentials: "same-origin",
                                    headers: {
                                      "Content-Type":
                                        "application/octet-stream",
                                      "X-Pinna-Evidence": encodeURIComponent(
                                        JSON.stringify({
                                          ...metadata,
                                          revision: saved.revision,
                                          filename: file.name,
                                        }),
                                      ),
                                    },
                                    body: file,
                                    signal: AbortSignal.timeout(45000),
                                  },
                                );
                                const result = await response.json();
                                if (!response.ok)
                                  throw new Error(
                                    result.error ?? "Upload failed.",
                                  );
                                await open(saved.id);
                                setMessage("Document uploaded privately.");
                              })
                            }
                          />
                        )}
                      </>
                    ) : (
                      <div className="client-empty">
                        <Save size={25} />
                        <p>
                          Save your portfolio draft before uploading its
                          verification documents.
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab === "history" && (
                  <>
                    <SectionTitle
                      eyebrow="05 / ACCOUNTABILITY"
                      title="Every step, recorded"
                      description="Submissions keep a fixed copy of the portfolio and its evidence. Decisions and changes stay in this portfolio’s history."
                    />
                    {detail?.submissions.length ? (
                      <div className="client-submissions">
                        {detail.submissions.map((s) => (
                          <div key={s.id}>
                            <strong>Submission {s.version}</strong>
                            <span>{labels[s.state] ?? s.state}</span>
                            <small>{date(s.submitted_at)}</small>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No submissions yet.</p>
                    )}
                    <ol className="client-timeline">
                      {detail?.history.map((event) => (
                        <li key={event.id}>
                          <span className="client-timeline-dot" />
                          <div>
                            <strong>
                              {event.action
                                .replace(/^PORTFOLIO_/, "")
                                .replaceAll("_", " ")
                                .toLowerCase()}
                            </strong>
                            <p>{event.note}</p>
                            <small>
                              {event.actor_name ?? "pinnaa"} ·{" "}
                              {date(event.created_at)} · revision{" "}
                              {event.revision}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
                {editable && tab !== "operations" && (
                  <div className="client-editor-footer">
                    <span>
                      <ShieldCheck size={15} /> Saved privately until approved
                    </span>
                    <button
                      type="submit"
                      className="button primary"
                      disabled={busy}
                    >
                      {busy ? (
                        <LoaderCircle size={17} className="spin" />
                      ) : (
                        <Save size={17} />
                      )}{" "}
                      Save draft
                    </button>
                  </div>
                )}
              </form>
              {detail && (
                <section className="panel client-submission-panel">
                  <div>
                    <h2>
                      {business
                        ? "Ready for the next step?"
                        : "Review decision"}
                    </h2>
                    <p>
                      {business
                        ? "Publication requires Admin review and final Super Admin approval."
                        : "Check the registration, licence, service location, prices and insurance details before deciding."}
                    </p>
                  </div>
                  {!business && (
                    <div className="client-business-summary">
                      <span className="eyebrow">
                        SUBMITTED BUSINESS IDENTITY
                      </span>
                      <h3>
                        {(
                          detail.submissionSnapshot?.businessProfile ??
                          detail.businessProfile
                        )?.tradingName ?? "Business profile incomplete"}
                      </h3>
                      <p>
                        Registration:{" "}
                        {(
                          detail.submissionSnapshot?.businessProfile ??
                          detail.businessProfile
                        )?.registrationNumber ?? "—"}
                      </p>
                      <p>
                        {detail.businessProfile?.contactName} ·{" "}
                        {detail.businessProfile?.contactEmail}
                      </p>
                    </div>
                  )}
                  {business && editable && (
                    <>
                      <ul className="client-requirements">
                        {detail.requirements.length ? (
                          detail.requirements.map((requirement) => (
                            <li key={requirement}>
                              <AlertCircle size={15} />
                              {requirement}
                            </li>
                          ))
                        ) : (
                          <li>
                            <CheckCircle2 size={16} /> The saved portfolio is
                            ready to submit.
                          </li>
                        )}
                      </ul>
                      <button
                        className="button primary"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            const saved = await persist();
                            await api(`portfolios/${saved.id}/submit`, {
                              revision: saved.revision,
                            });
                            await open(saved.id);
                            await refresh();
                            setMessage("Portfolio submitted for Admin review.");
                          })
                        }
                      >
                        <Send size={16} /> Save & submit for review
                      </button>
                    </>
                  )}
                  {!business &&
                    ["SUBMITTED", "ADMIN_RECOMMENDED", "APPROVED"].includes(
                      detail.portfolio.status,
                    ) && (
                      <>
                        <Field label="Review note / rationale">
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            minLength={10}
                            maxLength={2000}
                            rows={3}
                            placeholder="Record your checks and explain this decision to the business."
                          />
                        </Field>
                        <p className="client-review-check-hint">
                          Download and mark each document as reviewed in
                          Verification documents. Your decision applies to the
                          locked submission shown above.
                        </p>
                        <div className="client-inline-actions">
                          {user.role === "ADMIN" &&
                            detail.portfolio.status === "SUBMITTED" && (
                              <button
                                className="button primary"
                                disabled={
                                  busy ||
                                  reviewNote.trim().length < 10 ||
                                  reviewed.length !== detail.documents.length
                                }
                                onClick={() => run(() => decision("recommend"))}
                              >
                                <ShieldCheck size={16} /> Recommend approval
                              </button>
                            )}
                          {user.role === "SUPER_ADMIN" &&
                            detail.portfolio.status === "ADMIN_RECOMMENDED" && (
                              <button
                                className="button primary"
                                disabled={
                                  busy ||
                                  reviewNote.trim().length < 10 ||
                                  reviewed.length !== detail.documents.length
                                }
                                onClick={() => run(() => decision("approve"))}
                              >
                                <CheckCircle2 size={16} /> Approve & publish
                              </button>
                            )}
                          {detail.portfolio.status !== "APPROVED" ? (
                            <button
                              className="button secondary"
                              disabled={busy || reviewNote.trim().length < 10}
                              onClick={() =>
                                run(() => action("request-changes"))
                              }
                            >
                              Return for changes
                            </button>
                          ) : (
                            <button
                              className="button secondary"
                              disabled={busy || reviewNote.trim().length < 10}
                              onClick={() => run(() => action("suspend"))}
                            >
                              Suspend listing
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  {business && (
                    <div className="client-inline-actions">
                      {!detail.portfolio.archived_at &&
                        ["SUBMITTED", "ADMIN_RECOMMENDED"].includes(
                          detail.portfolio.status,
                        ) && (
                          <button
                            className="button secondary"
                            disabled={busy}
                            onClick={() => {
                              setPending("withdraw");
                              setReviewNote("");
                            }}
                          >
                            Withdraw submission
                          </button>
                        )}
                      {!detail.portfolio.archived_at &&
                        detail.portfolio.status === "APPROVED" && (
                          <button
                            className="button secondary"
                            disabled={busy}
                            onClick={() => {
                              setPending("reopen");
                              setReviewNote("");
                            }}
                          >
                            Unpublish & edit
                          </button>
                        )}
                      {!detail.portfolio.archived_at ? (
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => {
                            setPending("archive");
                            setReviewNote("");
                          }}
                        >
                          <Archive size={15} /> Archive portfolio
                        </button>
                      ) : (
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => {
                            setPending("restore");
                            setReviewNote("");
                          }}
                        >
                          Restore as draft
                        </button>
                      )}
                    </div>
                  )}
                  {pending && (
                    <div className="client-action-confirmation">
                      <h3>
                        Confirm{" "}
                        {pending === "reopen" ? "unpublish and edit" : pending}
                      </h3>
                      <p>
                        This portfolio will be private. A new review is required
                        before it can appear in discovery again. Existing
                        conversation history is kept.
                      </p>
                      <Field label="Reason">
                        <textarea
                          rows={2}
                          value={reviewNote}
                          maxLength={2000}
                          minLength={10}
                          onChange={(e) => setReviewNote(e.target.value)}
                        />
                      </Field>
                      <div className="client-inline-actions">
                        <button
                          className="button primary"
                          disabled={busy || reviewNote.trim().length < 10}
                          onClick={() => run(() => action(pending))}
                        >
                          Confirm
                        </button>
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => setPending("")}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="client-section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
function HoursRow({
  hours,
  disabled,
  onChange,
}: {
  hours: OpeningHours;
  disabled: boolean;
  onChange: (value: OpeningHours) => void;
}) {
  return (
    <div className="client-hours-row">
      <strong>{days[hours.day]}</strong>
      <label className="client-check">
        <input
          type="checkbox"
          checked={hours.closed}
          disabled={disabled}
          onChange={(e) => onChange({ ...hours, closed: e.target.checked })}
        />
        Closed
      </label>
      <label className="client-check">
        <input
          type="checkbox"
          checked={hours.allDay}
          disabled={disabled || hours.closed}
          onChange={(e) => onChange({ ...hours, allDay: e.target.checked })}
        />
        24 hours
      </label>
      <input
        aria-label={`${days[hours.day]} opens`}
        type="time"
        disabled={disabled || hours.closed || hours.allDay}
        value={hours.opens}
        onChange={(e) => onChange({ ...hours, opens: e.target.value })}
      />
      <span>to</span>
      <input
        aria-label={`${days[hours.day]} closes`}
        type="time"
        disabled={disabled || hours.closed || hours.allDay}
        value={hours.closes}
        onChange={(e) => onChange({ ...hours, closes: e.target.value })}
      />
      <label className="client-check">
        <input
          type="checkbox"
          checked={hours.overnight}
          disabled={disabled || hours.closed || hours.allDay}
          onChange={(e) => onChange({ ...hours, overnight: e.target.checked })}
        />
        Next day
      </label>
    </div>
  );
}
function EvidenceUpload({
  options,
  portfolio,
  disabled,
  upload,
}: {
  options: ClientOptions | null;
  portfolio: ClientPortfolio;
  disabled: boolean;
  upload: (file: File, metadata: object) => Promise<void>;
}) {
  const [kind, setKind] = useState("registration"),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="client-upload" ref={ref}>
      <h3>Upload a verification document</h3>
      <p>
        PDF, PNG, JPEG or WebP · maximum 3 MB. Documents are private
        attachments, never public listing images.
      </p>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <div className="client-fields">
        <Field label="Document type">
          <select
            disabled={disabled}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {options?.documentKinds.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Document number">
          <input
            disabled={disabled}
            name="documentNumber"
            data-evidence="number"
            key={kind}
            defaultValue={
              kind === "licence"
                ? portfolio.license_number
                : portfolio.registration_number
            }
            maxLength={100}
          />
        </Field>
        <Field label="Issuing authority">
          <input
            disabled={disabled}
            name="issuingAuthority"
            data-evidence="issuer"
            maxLength={150}
            defaultValue={portfolio.licensing_authority}
          />
        </Field>
        <Field
          label={
            kind === "licence"
              ? "Expiry date (required)"
              : "Expiry date (if applicable)"
          }
        >
          <input disabled={disabled} type="date" data-evidence="expiry" />
        </Field>
        <div className="client-field-wide">
          <Field label="Choose document">
            <input
              disabled={disabled}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                setError(
                  f && f.size > 3 * 1024 * 1024
                    ? "Choose a file up to 3 MB."
                    : "",
                );
              }}
            />
          </Field>
        </div>
      </div>
      <button
        className="button secondary"
        type="button"
        disabled={disabled || !file || file.size > 3 * 1024 * 1024}
        onClick={async () => {
          const number = (
            ref.current?.querySelector(
              '[data-evidence="number"]',
            ) as HTMLInputElement
          ).value;
          const issuer = (
            ref.current?.querySelector(
              '[data-evidence="issuer"]',
            ) as HTMLInputElement
          ).value;
          const expiry = (
            ref.current?.querySelector(
              '[data-evidence="expiry"]',
            ) as HTMLInputElement
          ).value;
          if (
            number.trim().length < 2 ||
            issuer.trim().length < 2 ||
            (!expiry && kind === "licence")
          ) {
            setError(
              "Add the document number, issuing authority and licence expiry date.",
            );
            return;
          }
          setError("");
          if (file)
            await upload(file, {
              kind,
              documentNumber: number,
              issuingAuthority: issuer,
              expiresOn: expiry || null,
            });
        }}
      >
        <Upload size={16} /> Upload privately
      </button>
    </div>
  );
}
function BusinessProfileForm({
  initial,
  userName,
  email,
  busy,
  onSave,
}: {
  initial: BusinessProfile | null;
  userName: string;
  email: string;
  busy: boolean;
  onSave: (value: BusinessProfile) => Promise<void>;
}) {
  const [value, setValue] = useState<BusinessProfile>(
    initial ?? {
      tradingName: "",
      registrationNumber: "",
      contactName: userName,
      contactEmail: email,
      contactPhone: "",
      county: "",
      address: "",
      website: "",
      description: "",
      revision: 0,
    },
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    void onSave(value);
  }
  const fields: [keyof BusinessProfile, string, string][] = [
    ["tradingName", "Business / trading name", "text"],
    ["registrationNumber", "Business registration number", "text"],
    ["contactName", "Primary contact name", "text"],
    ["contactPhone", "Contact phone (+254…)", "tel"],
    ["contactEmail", "Business contact email", "email"],
    ["county", "County", "text"],
    ["address", "Registered / business address", "text"],
    ["website", "Website (optional, HTTPS)", "url"],
  ];
  return (
    <form className="panel client-profile-panel" onSubmit={submit}>
      <SectionTitle
        eyebrow="YOUR BUSINESS IDENTITY"
        title="The business behind your portfolios"
        description="These details identify the account that manages your service locations. Each portfolio keeps its own licence and verification record."
      />
      <fieldset disabled={busy} className="client-fields">
        {fields.map(([key, label, type]) => (
          <Field label={label} key={key}>
            <input
              type={type}
              required={key !== "website"}
              value={String(value[key])}
              minLength={key === "website" ? undefined : 2}
              maxLength={key === "address" || key === "website" ? 300 : 150}
              pattern={
                key === "contactPhone" ? "\\+[1-9][0-9]{7,14}" : undefined
              }
              onChange={(e) => setValue({ ...value, [key]: e.target.value })}
            />
          </Field>
        ))}
        <div className="client-field-wide">
          <Field label="About your business (optional)">
            <textarea
              rows={4}
              maxLength={2000}
              value={value.description}
              onChange={(e) =>
                setValue({ ...value, description: e.target.value })
              }
            />
          </Field>
        </div>
      </fieldset>
      <div className="client-editor-footer">
        <p>
          Registered identity changes require any submitted or published
          portfolios to be withdrawn first.
        </p>
        <button className="button primary" disabled={busy}>
          <Save size={16} /> Save business profile
        </button>
      </div>
    </form>
  );
}
