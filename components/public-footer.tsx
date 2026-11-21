import Link from "next/link";
export function PublicFooter() {
  return (
    <footer className="auth-footer public-footer">
      <span>© {new Date().getFullYear()} Pinnaa. All rights reserved.</span>
      <div>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/help">Help & support</Link>
        <span className="footer-location">
          Made for connections that matter
        </span>
      </div>
    </footer>
  );
}
