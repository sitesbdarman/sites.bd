"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { homeText, tr } from "@/lib/i18n/translations";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";

type IconName = "globe" | "star" | "tag" | "cart" | "mail" | "gift" | "bolt" | "server" | "settings" | "shield" | "users" | "search" | "arrow";

function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "globe": return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z"/></svg>;
    case "star": return <svg {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>;
    case "tag": return <svg {...common}><path d="M20 13 13 20 4 11V4h7l9 9Z"/><circle cx="8" cy="8" r="1"/></svg>;
    case "cart": return <svg {...common}><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>;
    case "mail": return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
    case "gift": return <svg {...common}><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7H8.5A2.5 2.5 0 1 1 12 4.5V7ZM12 7h3.5A2.5 2.5 0 1 0 12 4.5V7Z"/></svg>;
    case "bolt": return <svg {...common}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/></svg>;
    case "server": return <svg {...common}><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h.01M7 17h.01M11 7h7M11 17h7"/></svg>;
    case "settings": return <svg {...common}><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="m4.9 4.9 1.4 1.4M17.7 17.7l1.4 1.4M4 12H2M22 12h-2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 4V2M12 22v-2"/></svg>;
    case "shield": return <svg {...common}><path d="M12 3 20 6v5c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>;
    case "users": return <svg {...common}><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.2 2.4-5 6-5s5.5 1.8 6 5M16 5.5a3 3 0 0 1 0 5.8M17 15c2.5.5 3.8 2.1 4 5"/></svg>;
    case "search": return <svg {...common}><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>;
    case "arrow": return <svg {...common}><path d="M5 12h13M13 6l6 6-6 6"/></svg>;
  }
}

const featureIcons: IconName[] = ["gift", "bolt", "server", "settings", "shield", "users"];
const featureTones = ["blue", "green", "purple", "orange", "red", "teal"] as const;

const toneText: Record<string, string> = {
  blue: "text-blue-600",
  green: "text-emerald-600",
  purple: "text-violet-600",
  orange: "text-orange-600",
  red: "text-rose-600",
  teal: "text-teal-600",
};

interface HomeContentProps {
  loggedIn: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
}

export function HomeContent({ loggedIn, avatarUrl, fullName, email }: HomeContentProps) {
  const { language } = useLanguage();
  const t = homeText;

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-800">
      <PublicNavbar loggedIn={loggedIn} avatarUrl={avatarUrl} fullName={fullName} email={email} />
      <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 px-5 pb-16 pt-32 text-center text-white lg:px-8">
        {/* Subtle lattice motif echoing the brand mark, instead of blurry decorative orbs. */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
          <defs>
            <pattern id="lattice" width="56" height="56" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lattice)" />
        </svg>
        <div className="absolute -right-24 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 opacity-[0.08]" aria-hidden="true">
          <Icon name="globe" className="h-full w-full" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">{tr(t.hero.title, language)}</h1>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">SITES.BD</h2>
          <p className="mx-auto mt-5 max-w-4xl text-lg leading-8 text-white/90 sm:text-2xl">
            {tr(t.hero.lead, language)}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="#order" className="rounded-full bg-white px-8 py-4 text-lg font-extrabold text-blue-600 transition-transform active:scale-[.98]">
              <Icon name="gift" className="mr-3 inline h-6 w-6" />{tr(t.hero.ctaPrimary, language)}
            </Link>
            <a href="#features" className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-lg font-extrabold backdrop-blur transition-colors hover:bg-white/15 active:scale-[.98]">
              {tr(t.hero.ctaSecondary, language)} <Icon name="arrow" className="ml-2 inline h-5 w-5" />
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {t.hero.stats.map((stat) => (
              <div key={stat.label.en} className="rounded-[--radius-surface] border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                <div className="text-3xl font-extrabold">{tr(stat.value, language)}</div><div className="mt-1 text-white/75">{tr(stat.label, language)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="order" className="scroll-mt-24 bg-blue-50 px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{tr(t.order.title, language)}</h2>
          <p className="mt-4 text-lg text-gray-600">{tr(t.order.subtitle, language)}</p>
          <form action="/domains/search" className="mt-9 rounded-[--radius-surface] border border-blue-100 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                <input name="q" required pattern="[^\s]+" placeholder={tr(t.order.placeholder, language)} className="min-w-0 flex-1 bg-transparent px-4 py-4 text-lg outline-none" />
              </div>
              <button className="rounded-xl bg-blue-600 px-7 py-4 font-extrabold text-white transition-colors hover:bg-blue-700 active:scale-[.98]">
                <Icon name="search" className="mr-2 inline h-5 w-5" />{tr(t.order.button, language)}
              </button>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">{tr(t.order.example, language)}</p>
          </form>
        </div>
      </section>

      <section id="features" className="bg-white px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl"><Icon name="star" className="mr-3 inline h-9 w-9 text-blue-600" />{tr(t.featuresHeading.title, language)}</h2>
            <p className="mt-4 text-lg text-gray-600">{tr(t.featuresHeading.subtitle, language)}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, i) => (
              <article key={feature.title.en} className={`surface accent-bar p-8 pl-9 transition-colors hover:border-gray-300 ${toneText[featureTones[i]!]}`}>
                <Icon name={featureIcons[i]!} className="h-8 w-8" />
                <h3 className="mt-5 text-2xl font-extrabold text-gray-800">{tr(feature.title, language)}</h3>
                <p className="mt-4 leading-7 text-gray-600">{tr(feature.text, language)}</p>
                <ul className="mt-6 space-y-2 text-gray-700">
                  {feature.items.map((item) => <li key={item.en}>✓ <span className="ml-1">{tr(item, language)}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl"><Icon name="settings" className="mr-3 inline h-9 w-9 text-blue-600" />{tr(t.howItWorks.title, language)}</h2>
            <p className="mt-4 text-lg text-gray-600">{tr(t.howItWorks.subtitle, language)}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {t.howItWorks.steps.map((step, i) => (
              <div key={step.title.en} className="relative text-center">
                {i < t.howItWorks.steps.length - 1 && (
                  <div className="absolute left-1/2 top-6 hidden h-px w-full bg-gray-300 md:block" aria-hidden="true" />
                )}
                <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-lg font-extrabold text-blue-600">
                  {i + 1}
                </div>
                <h3 className="mt-5 text-2xl font-extrabold">{tr(step.title, language)}</h3>
                <p className="mt-3 leading-7 text-gray-600">{tr(step.text, language)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
