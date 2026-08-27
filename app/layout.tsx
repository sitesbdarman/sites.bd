import type { Metadata, Viewport } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

// Body/UI face: Inter — neutral, extremely legible at small sizes, the safe
// choice for a data-dense dashboard product like a registrar/hosting panel.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// Display face for headings/hero: Lexend — a bit more geometric and confident
// than Inter at large sizes, without introducing a second unrelated family.
const lexend = Lexend({ subsets: ["latin"], variable: "--font-display", display: "swap" });

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
    <html lang="en" className={`h-full antialiased ${inter.variable} ${lexend.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
