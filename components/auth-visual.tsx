import Image from "next/image";
import {
  Building2,
  HeartPulse,
  Leaf,
  MapPinned,
  PawPrint,
  ShieldCheck,
} from "lucide-react";

export function AuthVisual({ business = false }: { business?: boolean }) {
  return (
    <aside className="auth-visual welcome-visual">
      <div className="welcome-story">
        <span className="welcome-eyebrow">
          <span /> ONE HEALTH. CONNECTED.
        </span>
        <h1>
          {business ? (
            <>
              <span>Your business.</span> <span>A world of</span>{" "}
              <em>connections.</em>
            </>
          ) : (
            <>
              <span>Good care.</span> <span>Closer</span> <em>connections.</em>
            </>
          )}
        </h1>
        <p>
          {business
            ? "Bring every location, service and customer conversation together. Build your presence in the pinnaa provider network."
            : "Healthcare, animal health and everyday essentials. Find the right providers, make informed choices, and connect with confidence."}
        </p>
        <div className="welcome-pillars" aria-label="The One Health community">
          <span>
            <HeartPulse size={17} /> People
          </span>
          <span>
            <PawPrint size={17} /> Animals
          </span>
          <span>
            <Leaf size={17} /> Environment
          </span>
        </div>
      </div>
      <div className="welcome-scene">
        <Image
          src="/images/welcome/one-health-campus.jpg"
          alt="Illustration of a modern healthcare campus surrounded by greenery"
          fill
          sizes="(max-width: 900px) 100vw, 55vw"
          priority
          className="welcome-campus"
        />
        <div className="welcome-scene-shade" />
        <div className="welcome-location-card">
          <span className="welcome-location-icon">
            <MapPinned size={23} />
          </span>
          <div>
            <strong>
              {business
                ? "Every location. One workspace."
                : "The right provider, closer to you."}
            </strong>
            <span>
              {business
                ? "Your services, availability and connections."
                : "Discover by location, service and insurance."}
            </span>
          </div>
          <ShieldCheck size={21} />
        </div>
        <div className="welcome-scene-caption">
          <Building2 size={16} />
          <span>A connected community of essential services</span>
        </div>
      </div>
      <div className="welcome-visual-footer">
        <span>Built for a healthier, more connected future.</span>
        <span>pinnaa · Kenya</span>
      </div>
    </aside>
  );
}
