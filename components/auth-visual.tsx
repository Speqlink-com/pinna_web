import {
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  Navigation,
  Plus,
  HeartPulse,
  Pill,
  Building2,
} from "lucide-react";
export function AuthVisual({ business = false }: { business?: boolean }) {
  return (
    <aside className="auth-visual">
      <div className="visual-copy">
        <div className="eyebrow">
          <span className="tiny-dot" /> A LITTLE CLOSER. A LOT EASIER.
        </div>
        <h1>
          {business ? (
            <>
              Your services.
              <br />
              More connections.
            </>
          ) : (
            <>
              The right care.
              <br />
              Closer to you.
            </>
          )}
        </h1>
        <p>
          {business
            ? "One account. Every portfolio. Connect your services with the people looking for them."
            : "Find providers that fit your insurance, your budget, and your neighborhood."}
        </p>
      </div>
      <div
        className="care-map"
        aria-label="Illustration of connected healthcare services"
      >
        <div className="map-road road-one" />
        <div className="map-road road-two" />
        <div className="map-road road-three" />
        <div className="map-block block-one" />
        <div className="map-block block-two" />
        <div className="map-block block-three" />
        <div className="map-block block-four" />
        <div className="map-label label-one">YOUR NEIGHBORHOOD</div>
        <div className="map-label label-two">CARE, CONNECTED</div>
        <div className="map-ring ring-one" />
        <div className="map-ring ring-two" />
        <div className="map-ring ring-three" />
        <div className="map-person">
          <Navigation size={22} fill="currentColor" />
        </div>
        <div className="map-pin pin-one">
          <HeartPulse size={21} />
        </div>
        <div className="map-pin pin-two">
          <Pill size={20} />
        </div>
        <div className="map-pin pin-three">
          <Building2 size={21} />
        </div>
        <div className="floating-match">
          <div className="match-icon">
            <Plus size={24} />
          </div>
          <div>
            <strong>A better match, nearby</strong>
            <span>
              <ShieldCheck size={12} /> Your insurance. Your choice.
            </span>
          </div>
          <ArrowUpRight size={17} />
        </div>
        <div className="distance-tag">
          <MapPin size={13} /> Find your kind of care
        </div>
      </div>
      <div className="visual-bottom">
        <div className="mini-icons">
          <HeartPulse size={16} />
          <Pill size={16} />
          <Building2 size={16} />
        </div>
        <p>
          Healthcare, pharmacies, agrovets
          <br />
          and more. All in one place.
        </p>
        <span className="visual-page">01 — 03</span>
      </div>
    </aside>
  );
}
