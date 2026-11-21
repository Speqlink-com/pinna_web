import type { NextConfig } from "next";
// Only the public Mapbox token is safe to embed in the browser bundle.
const mapboxToken = (
  process.env.MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  ""
).trim();
if (mapboxToken && !mapboxToken.startsWith("pk.")) {
  throw new Error(
    "MAPBOX_TOKEN must be a public Mapbox token starting with pk.",
  );
}
const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_MAPBOX_TOKEN: mapboxToken },
  poweredByHeader: false,
  serverExternalPackages: ["pg", "nodemailer"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.mapbox.com; font-src 'self'; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default nextConfig;
