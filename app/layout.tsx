import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./premium.css";
import "./system.css";
const inter = localFont({
  src: [
    {
      path: "../public/fonts/Inter_400Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter_600SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/Inter_700Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "pinnaa — The right care. Closer to you.",
    template: "%s | pinnaa",
  },
  description:
    "Find providers that fit your insurance, budget, and location. Connect to healthcare, pharmacies, agrovets, and more with Pinnaa.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047b90",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
