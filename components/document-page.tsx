import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, HeartPulse, Building2, ShieldCheck } from "lucide-react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PremiumIcon } from "./premium-icon";
const content: Record<
  string,
  { title: string; intro: string; sections: { title: string; text: string }[] }
> = {
  privacy: {
    title: "Your privacy matters.",
    intro: "How Pinnaa handles information in this web application.",
    sections: [
      {
        title: "Your account",
        text: "We use your name, email address, and account purpose to create your account and route you to your personal, business, or administrative workspace. Passwords are hashed; session cookies cannot be read by browser scripts.",
      },
      {
        title: "Your location",
        text: "Location sharing is optional and begins only after you choose Use my location and allow your browser’s permission request. Coordinates are used for the current discovery search, are not saved to your account, and are not used for background tracking. You can search by county instead.",
      },
      {
        title: "Your conversations",
        text: "Messages are available to the customer and the owner of the portfolio involved in the conversation. Share only information needed for your enquiry. This application does not provide a clinical record or prescription upload service.",
      },
      {
        title: "Business information",
        text: "Business portfolios begin as private drafts. Publication requires verification and approval. You are responsible for keeping contact, service, insurance, and price information accurate.",
      },
      {
        title: "Google sign-in",
        text: "If you choose Google, we request your basic profile and verified email to identify your account. We do not request your Gmail, contacts, or Google Drive content.",
      },
      {
        title: "Account and data requests",
        text: "Use the official Pinnaa support channel provided by your service operator for access, correction, deletion, or security questions. Retention periods, a verified privacy contact, and the final operating privacy policy must be published before public launch.",
      },
    ],
  },
  terms: {
    title: "Good connections. Clear terms.",
    intro: "Terms for using this phase of Pinnaa.",
    sections: [
      {
        title: "What pinnaa does",
        text: "pinnaa helps people discover and connect with providers by service, insurance, location, and listed prices. Business clients can manage multiple independent portfolios using one account.",
      },
      {
        title: "Your account",
        text: "Provide accurate account details and keep your password and recovery codes private. Business selection creates a business account; it does not grant platform administration. Administrative access is issued by the platform owner.",
      },
      {
        title: "Before you travel",
        text: "Confirm the exact service, availability, insurance plan, coverage, and final price with the provider. A listed starting price is not a confirmed bill. Distances are straight-line estimates rather than route or arrival-time estimates.",
      },
      {
        title: "Provider publication",
        text: "Portfolio creation does not publish or verify a business. Admin review and Super Admin approval are separate stages. Regulatory evidence and a complete approval process are required before public publication.",
      },
      {
        title: "Ambulance enquiries",
        text: "An ambulance directory listing or a conversation is an enquiry. It does not create or confirm a dispatch, emergency response, or arrival time.",
      },
      {
        title: "Launch status",
        text: "The application includes account services and initial dashboard and portfolio workflows. Public launch terms, support contacts, verification operations, and regulatory review remain to be finalized by Pinnaa. Design previews contain fictional data and do not represent live service providers.",
      },
    ],
  },
  help: {
    title: "A little help, right here.",
    intro: "pinnaa connects people with the services that fit their lives.",
    sections: [
      {
        title: "Find care for yourself",
        text: "Create a personal account, verify your email, and search providers by service, area, insurance plan, or budget. Choose Use my location if you want to compare distance. Save providers and start a conversation to confirm details.",
      },
      {
        title: "Bring your business to pinnaa",
        text: "Choose Pinnaa Business when creating an account and verify your email. Register each business with its location, services and required documents, then submit it for review. One provider account can manage businesses at different locations. Each is reviewed separately before publication.",
      },
      {
        title: "Sign in with Google",
        text: "Use Sign up with Google for a new account and Sign in with Google for an existing Google-linked account. Existing password accounts continue using their password. Google credentials must be configured by the service operator.",
      },
      {
        title: "Administrative access",
        text: "Only the Super Admin can create other admins. Invited admins receive a temporary password by email and must replace it. Administrative sign-in supports authenticator verification or a six-digit code sent to the verified account email.",
      },
      {
        title: "Email or password trouble",
        text: "Use Forgot password to request a reset link. If your email is not verified, request a new six-digit verification code from the sign-in screen. Check your spam folder. For admin email verification, choose Email OTP, request a code and enter it in the code field before selecting Verify and continue.",
      },
      {
        title: "Explore the design",
        text: "Local design previews are available for customer, business, and admin dashboards. They use synthetic data and never create accounts, send messages, email invitations, or publish providers.",
      },
    ],
  },
};
export function DocumentPage({ document }: { document: string }) {
  const entry = content[document];
  if (!entry) notFound();
  return (
    <div className="document-page public-page">
      <PublicHeader />
      <main id="public-main" className="public-scroll" tabIndex={-1}>
        <div className="document-content">
          <Link href="/sign-in" className="back-link">
            <PremiumIcon name="chevron" size={15} /> Back to pinnaa
          </Link>
          <div className="eyebrow">PINNAA</div>
          <h1>{entry.title}</h1>
          <p className="document-intro">{entry.intro}</p>
          {document !== "help" ? (
            <div className="notice">
              Pre-launch application notice · Updated 9 November 2026. Pinnaa
              must finalize its operating policies before public launch.
            </div>
          ) : null}
          {entry.sections.map((s, index) => (
            <section
              key={s.title}
              id={
                document === "help" && index === 1
                  ? "provider-help"
                  : document === "help" && index === 4
                    ? "account-help"
                    : `section-${index + 1}`
              }
            >
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
          {document === "help" && process.env.NODE_ENV !== "production" ? (
            <div className="preview-links">
              <Link href="/preview/customer">
                <HeartPulse size={19} /> Customer preview{" "}
                <ArrowUpRight size={16} />
              </Link>
              <Link href="/preview/business">
                <Building2 size={19} /> Business preview{" "}
                <ArrowUpRight size={16} />
              </Link>
              <Link href="/preview/admin">
                <ShieldCheck size={19} /> Admin preview{" "}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          ) : null}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
