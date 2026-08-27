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
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9f7] text-[#10241c]">
      <PublicNavbar loggedIn={loggedIn} avatarUrl={avatarUrl} fullName={fullName} email={email} />

      {/* HERO — deep registry-ink background; the certificate card below is the signature element. */}
      <section id="home" className="relative overflow-hidden bg-[#10241c] px-5 pb-0 pt-32 text-[#f2f7f3] lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#e05a35]/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#157a53]/20 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 font-mono-data text-xs uppercase tracking-[0.2em] text-[#9fd8bd]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3fcf8e]" /> registrar.sites.bd — status: open
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {tr(t.hero.title, language)}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-8 text-[#c9d9d0] sm:text-xl">
            {tr(t.hero.lead, language)}
          </p>
        </div>

        {/* Signature element: the domain lookup rendered as a registration certificate / claim ticket. */}
        <div id="order" className="relative z-10 mx-auto mt-12 w-full max-w-3xl scroll-mt-24 pb-20">
          <form action="/domains/search" className="relative rounded-t-2xl border border-white/10 bg-[#f7f9f7] text-[#10241c] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-dashed border-[#c8d6cd] px-6 py-4">
              <div>
                <p className="font-mono-data text-[11px] uppercase tracking-[0.25em] text-[#5c7269]">Certificate of Availability</p>
                <p className="mt-0.5 text-sm font-semibold text-[#10241c]">{tr(t.order.title, language)}</p>
              </div>
              <span className="hidden rounded-full border border-[#c8d6cd] px-3 py-1 font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#5c7269] sm:inline-block">SITES.BD</span>
            </div>

            <div className="px-6 py-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[#c8d6cd] bg-white px-4 focus-within:border-[#157a53] focus-within:ring-2 focus-within:ring-[#157a53]/25">
                  <span className="font-mono-data text-[#7c8f85]">$</span>
                  <input
                    name="q"
                    required
                    pattern="[^\s]+"
                    placeholder={tr(t.order.placeholder, language)}
                    className="min-w-0 flex-1 bg-transparent px-3 py-4 font-mono-data text-base text-[#10241c] outline-none placeholder:text-[#9aada2]"
                  />
                </div>
                <button className="rounded-xl bg-[#e05a35] px-7 py-4 font-semibold text-white shadow-lg shadow-[#e05a35]/25 transition hover:-translate-y-0.5 hover:bg-[#c8492a]">
                  <Icon name="search" className="mr-2 inline h-5 w-5" />{tr(t.order.button, language)}
                </button>
              </div>
              <p className="mt-3 font-mono-data text-xs text-[#5c7269]">{tr(t.order.example, language)}</p>
            </div>

            {/* perforated ticket edge */}
            <div className="relative h-6 overflow-hidden">
              <div className="absolute -left-3 -right-3 top-0 flex justify-between px-1">
                {Array.from({ length: 34 }).map((_, i) => (
                  <span key={i} className="h-6 w-6 rounded-full bg-[#10241c]" />
                ))}
              </div>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-3 px-2 pt-6 sm:justify-between">
            <Link href="#order" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#10241c] shadow-xl transition hover:-translate-y-0.5">
              <Icon name="gift" className="h-4 w-4 text-[#e05a35]" />{tr(t.hero.ctaPrimary, language)}
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-[#f2f7f3] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/10">
              {tr(t.hero.ctaSecondary, language)} <Icon name="arrow" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* STATS — ledger row, not glass cards: encodes "these are recorded facts" rather than decoration. */}
      <section className="border-b border-[#dbe5de] bg-white px-5 py-8 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-[#dbe5de] md:grid-cols-4">
          {t.hero.stats.map((stat) => (
            <div key={stat.label.en} className="px-4 py-2 text-center first:pl-0 last:pr-0">
              <div className="font-mono-data text-2xl font-semibold text-[#10241c] sm:text-3xl">{tr(stat.value, language)}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[#5c7269] sm:text-sm">{tr(stat.label, language)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="scroll-mt-24 bg-[#f7f9f7] px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="font-mono-data text-xs uppercase tracking-[0.25em] text-[#157a53]">What&rsquo;s included</span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{tr(t.featuresHeading.title, language)}</h2>
            <p className="mt-4 text-lg text-[#3f544a]">{tr(t.featuresHeading.subtitle, language)}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, i) => {
              const highlighted = i === 0;
              return (
                <article
                  key={feature.title.en}
                  className={`rounded-2xl border p-8 transition hover:-translate-y-1 ${
                    highlighted ? "border-[#e05a35]/30 bg-[#10241c] text-[#f2f7f3] shadow-xl" : "border-[#dbe5de] bg-white text-[#10241c] shadow-sm hover:shadow-lg"
                  }`}
                >
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${highlighted ? "bg-[#e05a35] text-white" : "bg-[#eaf2ee] text-[#157a53]"}`}>
                    <Icon name={featureIcons[i]!} className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold">{tr(feature.title, language)}</h3>
                  <p className={`mt-3 leading-7 ${highlighted ? "text-[#c9d9d0]" : "text-[#3f544a]"}`}>{tr(feature.text, language)}</p>
                  <ul className={`mt-5 space-y-2 text-sm ${highlighted ? "text-[#e7efe9]" : "text-[#26382f]"}`}>
                    {feature.items.map((item) => (
                      <li key={item.en} className="flex items-start gap-2">
                        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${highlighted ? "bg-[#e05a35]" : "bg-[#157a53]"}`} />
                        {tr(item, language)}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — a real ordered process, so numbering is earned here. */}
      <section className="bg-white px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="font-mono-data text-xs uppercase tracking-[0.25em] text-[#157a53]">Provisioning log</span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{tr(t.howItWorks.title, language)}</h2>
            <p className="mt-4 text-lg text-[#3f544a]">{tr(t.howItWorks.subtitle, language)}</p>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3">
            <div aria-hidden className="absolute left-0 right-0 top-9 hidden h-px bg-[#dbe5de] md:block" />
            {t.howItWorks.steps.map((step, i) => (
              <div key={step.title.en} className="relative rounded-2xl border border-[#dbe5de] bg-[#f7f9f7] p-8">
                <div className="font-mono-data flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#10241c] bg-white text-sm font-bold text-[#10241c]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-5 text-xl font-bold">{tr(step.title, language)}</h3>
                <p className="mt-3 leading-7 text-[#3f544a]">{tr(step.text, language)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
