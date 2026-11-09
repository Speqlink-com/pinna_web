"use client";
/* Optional user-supplied bitmap artwork needs a native image error fallback. */
/* eslint-disable @next/next/no-img-element */
import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
export function AssetButton({
  asset = "continue-button",
  children,
  busy = false,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  asset: string;
  busy?: boolean;
  variant?: "primary" | "google";
  children: ReactNode;
}) {
  const [missing, setMissing] = useState(false);
  const source =
    variant === "google"
      ? "/continue-witth-google-btn.png"
      : "/continue-btn.png";
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      aria-busy={busy}
      aria-label={
        props["aria-label"] ??
        (typeof children === "string" ? children : "Continue")
      }
      data-artwork={asset}
      className={`asset-button ${variant} ${busy ? "is-loading" : ""} ${props.className ?? ""}`}
    >
      <span className="asset-fallback">
        {busy ? (
          <LoaderCircle className="spin" size={18} />
        ) : variant === "google" ? (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.2c1.9-1.8 3-4.4 3-7.5ZM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22ZM6.4 14a6 6 0 0 1 0-4V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14ZM12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.5 9.5 0 0 0 12 2a10 10 0 0 0-8.9 5.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z"
            />
          </svg>
        ) : null}
        {busy ? "Please wait…" : children}
        {variant === "primary" && !busy ? <ArrowUpRight size={18} /> : null}
      </span>
      {!missing && !busy ? (
        <img
          className="button-asset"
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) {
              node.style.opacity = "1";
              node.closest("button")?.classList.add("artwork-loaded");
            }
          }}
          onLoad={(event) => {
            event.currentTarget.style.opacity = "1";
            event.currentTarget
              .closest("button")
              ?.classList.add("artwork-loaded");
          }}
          src={source}
          alt=""
          onError={() => setMissing(true)}
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}
