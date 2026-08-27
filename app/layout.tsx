import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

// Body/UI face: Inter — neutral, extremely legible at small sizes, the safe
// choice for a data-dense dashboard product like a registrar/hosting panel.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// Display face for headings/hero: Space Grotesk — geometric and confident,
// reads as technical/registry-grade rather than a generic SaaS gradient page.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
// Data face: used sparingly for domain names, prices and status — nods to the
// literal subject matter (DNS records, whois output) without going full "terminal".
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SITES.BD — Domains, Hosting & Web Services", template: "%s · SITES.BD" },
  description: "Register domains, manage hosting, and run your web services from one dashboard — built for Bangladesh.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable} ${plexMono.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
