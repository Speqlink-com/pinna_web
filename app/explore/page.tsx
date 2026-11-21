import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  HeartPulse,
  Leaf,
  Truck,
  ShieldCheck,
  MessageCircle,
  Search,
  MapPin,
  Clock3,
  PackageCheck,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { PremiumIcon } from "@/components/premium-icon";
import { platformIdentity, serviceGroups } from "@/lib/public-content";

export const metadata: Metadata = { title: "Explore Pinnaa" };
export default function ExplorePage() {
  return (
    <div className="public-page explore-page">
      <PublicHeader />
      <main
        id="public-main"
        className="public-scroll"
        tabIndex={-1}
        aria-label="Explore Pinnaa"
      >
        <section className="explore-intro" id="about">
          <div>
            <span className="eyebrow">ONE HEALTH. CONNECTED.</span>
            <h1>
              Care. Cultivate.
              <br />
              <em>Connect.</em>
            </h1>
            <p>{platformIdentity.introduction}</p>
            <div className="explore-actions">
              <Link className="button primary" href="/sign-up">
                Find your next connection <ArrowUpRight size={18} />
              </Link>
              <Link className="text-link" href="#how">
                See how it works <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
          <aside className="explore-values">
            <PremiumIcon name="location" size={52} />
            <h2>Closer to what matters.</h2>
            <p>{platformIdentity.ecosystem}</p>
            <div>
              <span>
                <HeartPulse size={18} />
                People
              </span>
              <span>
                <Leaf size={18} />
                Animals & environment
              </span>
            </div>
          </aside>
        </section>
        <section className="explore-section" id="purpose">
          <div className="explore-section-heading">
            <span className="eyebrow">A CONNECTED FUTURE</span>
            <h2>One purpose. More possibilities.</h2>
          </div>
          <div className="explore-two-grid">
            <article className="explore-card">
              <span className="explore-card-index">01 / OUR VISION</span>
              <h3>Healthier communities, together.</h3>
              <p>{platformIdentity.vision}</p>
            </article>
            <article className="explore-card">
              <span className="explore-card-index">02 / OUR MISSION</span>
              <h3>Make the next step easier.</h3>
              <p>{platformIdentity.mission}</p>
            </article>
          </div>
        </section>
        <section className="explore-section" id="people">
          <div className="explore-section-heading">
            <span className="eyebrow">BUILT AROUND YOU</span>
            <h2>For people. For providers.</h2>
            <p>
              Individuals and families, farmers, organizations and independent
              professionals. One place to find essential services and connect.
            </p>
          </div>
        </section>
        <section className="explore-section" id="services">
          <div className="explore-section-heading">
            <span className="eyebrow">EXPLORE THE NETWORK</span>
            <h2>Find your starting point.</h2>
          </div>
          <div className="explore-service-grid">
            {serviceGroups.map((s, i) => {
              const Icon = [HeartPulse, PackageCheck, Leaf, Truck][i];
              return (
                <article className="explore-card" id={s.id} key={s.id}>
                  <span className={`explore-service-icon service-${i}`}>
                    <Icon size={28} />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.detail}</p>
                  <Link href="/sign-in" className="text-link">
                    Find a provider <ArrowUpRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="explore-caption">
            For ambulance services, contact the provider directly to confirm
            availability. A listing or message does not confirm a dispatch.
          </p>
        </section>
        <section className="explore-section" id="how">
          <div className="explore-section-heading">
            <span className="eyebrow">YOUR NEXT CONNECTION</span>
            <h2>A clear path from finding to connecting.</h2>
          </div>
          <div className="explore-steps">
            {[
              {
                icon: Search,
                title: "Discover",
                text: "Search by service or area. Choose to share your location when you want to compare nearby providers.",
              },
              {
                icon: ShieldCheck,
                title: "Compare",
                text: "Check listed services, opening hours, insurance and indicative prices. Confirm the details that matter to you.",
              },
              {
                icon: MessageCircle,
                title: "Connect",
                text: "Message a provider from your account, ask questions and agree the next step directly.",
              },
            ].map((s, i) => (
              <article key={s.title}>
                <span className="explore-step-number">0{i + 1}</span>
                <s.icon size={24} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="explore-section explore-provider" id="providers">
          <div>
            <span className="eyebrow">YOUR BUSINESS, CONNECTED</span>
            <h2>
              Every location.
              <br />
              One workspace.
            </h2>
            <p>
              Register separate businesses and locations under one provider
              account. Keep services, operating hours, availability and optional
              inventory up to date, and respond to customer conversations.
            </p>
            <Link className="button primary" href="/sign-up?account=business">
              Join as a provider <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="explore-provider-tools">
            <span>
              <MapPin size={22} />
              Locations & contact details
            </span>
            <span>
              <Clock3 size={22} />
              Hours & service availability
            </span>
            <span>
              <PackageCheck size={22} />
              Offerings & optional stock
            </span>
            <span>
              <MessageCircle size={22} />
              Customer conversations
            </span>
          </div>
        </section>
        <section className="explore-section" id="approval">
          <div className="explore-section-heading">
            <span className="eyebrow">TRUST AT EVERY LOCATION</span>
            <h2>Register. Submit. Get reviewed.</h2>
            <p>
              Add your business details, set its location, list your offerings
              and provide the required documents. Each location stays private
              until it passes review and approval. You can follow the status
              from your provider workspace.
            </p>
          </div>
          <Link href="/help#provider-help" className="text-link">
            Business registration guidance <ArrowUpRight size={17} />
          </Link>
        </section>
        <section className="explore-contact" id="contact">
          <div>
            <span className="eyebrow">LET’S GET YOU CONNECTED</span>
            <h2>A little help, right here.</h2>
            <p>
              Find account guidance, prepare your business for approval, or sign
              in to contact a provider.
            </p>
          </div>
          <div className="explore-actions">
            <Link href="/help" className="button secondary">
              Visit the help centre <ArrowUpRight size={17} />
            </Link>
            <Link href="/sign-in" className="button primary">
              Sign in to Pinnaa <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
