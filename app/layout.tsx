import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { getSiteSettings } from "@/lib/site-settings";

const DEFAULT_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: "/icon-192.png",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.site_name || "SITES.BD";
  return {
    title: { default: `${siteName} — Domains, Hosting & Web Services`, template: `%s · ${siteName}` },
    description: "Register domains, manage hosting, and run your web services from one dashboard — built for Bangladesh.",
    manifest: "/manifest.webmanifest",
    // Falls back to the bundled app icons until an admin uploads a custom
    // favicon from Admin → Settings → Branding.
    icons: settings.favicon_url ? { icon: settings.favicon_url, apple: settings.favicon_url } : DEFAULT_ICONS,
  };
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>{children}</LanguageProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
