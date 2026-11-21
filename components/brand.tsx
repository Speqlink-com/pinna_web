import Link from "next/link";
import Image from "next/image";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="pinnaa home"
      className={`brand ${light ? "brand-light" : ""}`}
    >
      <Image
        className="brand-emblem"
        src="/brand/pinnaa-mark.webp"
        width={48}
        height={48}
        alt=""
        aria-hidden="true"
        unoptimized
      />
      <span className="brand-wordmark">
        pinnaa<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
