import Link from "next/link";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Pinna home"
      className={`brand ${light ? "brand-light" : ""}`}
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 42 42" fill="none">
          <path
            d="M21 32C13 27 7 21 7 15a7 7 0 0 1 14-1 7 7 0 0 1 14 1c0 6-6 12-14 17Z"
            stroke="currentColor"
            strokeWidth="2.8"
          />
          <path
            d="M14 21h5l3-7 3 13 3-6h6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        pinna<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
