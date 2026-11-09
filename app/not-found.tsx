import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
export default function NotFound() {
  return (
    <main className="standalone-state">
      <MapPin size={42} />
      <span className="eyebrow">404 · A LITTLE OFF THE MAP</span>
      <h1>Let’s get you connected.</h1>
      <p>This page isn’t available. Head back to Pinna to find your way.</p>
      <Link href="/" className="button primary">
        Back to Pinna <ArrowUpRight size={17} />
      </Link>
    </main>
  );
}
