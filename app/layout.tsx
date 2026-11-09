import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Pinna — The right care. Closer to you.",
    template: "%s | Pinna",
  },
  description:
    "Find providers that fit your insurance, budget, and location. Connect to healthcare, pharmacies, agrovets, and more with Pinna by Bismart Inc.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8f6",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
