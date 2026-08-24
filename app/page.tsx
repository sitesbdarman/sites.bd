import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { DeveloperCredit } from "@/components/DeveloperCredit";

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

const features = [
  { title: "100% Free", text: "Get your subdomain completely free with no hidden charges, setup fees, or monthly costs.", icon: "gift" as IconName, tone: "blue", items: ["No setup fees", "No monthly charges", "No hidden costs"] },
  { title: "Instant Activation", text: "Your subdomain can be created quickly with automatic DNS setup and immediate activation.", icon: "bolt" as IconName, tone: "green", items: ["Immediate creation", "Automatic DNS setup", "Ready to use"] },
  { title: "Any Hosting Support", text: "Connect your subdomain to your own hosting, Blogger, or a hosting plan from this platform.", icon: "server" as IconName, tone: "purple", items: ["Custom hosting", "Blogger compatible", "Hosting available"] },
  { title: "Easy Management", text: "Keep your domains, DNS records, orders, invoices and services in one simple dashboard.", icon: "settings" as IconName, tone: "orange", items: ["Easy order process", "DNS management", "User dashboard"] },
  { title: "Secure & Reliable", text: "Professional DNS infrastructure, protected accounts and clear service management.", icon: "shield" as IconName, tone: "red", items: ["Secure DNS", "Protected account", "Support when needed"] },
  { title: "For Everyone", text: "Built for beginners and developers alike. You do not need advanced technical knowledge to start.", icon: "users" as IconName, tone: "teal", items: ["Beginner friendly", "Developer ready", "Simple controls"] },
];

const toneClasses: Record<string, string> = {
  blue: "from-blue-50 to-blue-100 text-blue-600",
  green: "from-emerald-50 to-emerald-100 text-emerald-600",
  purple: "from-violet-50 to-violet-100 text-violet-600",
  orange: "from-orange-50 to-orange-100 text-orange-600",
  red: "from-rose-50 to-rose-100 text-rose-600",
  teal: "from-teal-50 to-teal-100 text-teal-600",
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { avatar_url: string | null; full_name: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-800">
      <nav className="sticky inset-x-0 top-0 z-50 border-b border-white/70 bg-white/95 shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-blue-600">
            <Icon name="globe" className="h-8 w-8" />
            SITES<span className="text-gray-800">.BD</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#home" className="transition hover:text-blue-600"><Icon name="globe" className="mr-2 inline h-4 w-4" />Home</a>
            <a href="#features" className="transition hover:text-blue-600"><Icon name="star" className="mr-2 inline h-4 w-4" />Features</a>
            <Link href="/pricing" className="transition hover:text-blue-600"><Icon name="tag" className="mr-2 inline h-4 w-4" />Pricing</Link>
            <Link href="/domains/search" className="transition hover:text-blue-600"><Icon name="search" className="mr-2 inline h-4 w-4" />Domain Search</Link>
            <a href="#order" className="transition hover:text-blue-600"><Icon name="cart" className="mr-2 inline h-4 w-4" />Order</a>
            <Link href="/contact" className="transition hover:text-blue-600"><Icon name="mail" className="mr-2 inline h-4 w-4" />Contact</Link>
          </div>
          <ProfileMenu loggedIn={Boolean(user)} avatarUrl={profile?.avatar_url} fullName={profile?.full_name} />
        </div>
      </nav>
      <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 px-5 pb-16 pt-32 text-center text-white lg:px-8">
        <div className="absolute -left-20 top-32 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute left-10 top-36 opacity-20"><Icon name="globe" className="h-20 w-20" /></div>
        <div className="absolute right-12 top-40 opacity-20"><Icon name="server" className="h-16 w-16" /></div>
        <div className="absolute bottom-28 left-16 opacity-20"><Icon name="settings" className="h-24 w-24" /></div>

        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">Free SubDomain Provider</h1>
          <h2 className="mt-2 text-4xl font-extrabold sm:text-5xl">SITES.BD</h2>
          <p className="mx-auto mt-5 max-w-4xl text-lg leading-8 text-white/90 sm:text-2xl">
            Get your <strong>FREE subdomain</strong> instantly! Connect to any hosting, use with Blogger, and start your online journey with zero cost and instant activation.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="#order" className="rounded-full bg-white px-8 py-4 text-lg font-extrabold text-blue-600 shadow-2xl transition hover:-translate-y-1">
              <Icon name="gift" className="mr-3 inline h-6 w-6" />Get Free Subdomain
            </Link>
            <a href="#features" className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-lg font-extrabold backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
              See Features <Icon name="arrow" className="ml-2 inline h-5 w-5" />
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[['100%', 'Free Forever'], ['Instant', 'Activation'], ['24/7', 'DNS Updates'], ['Any', 'Hosting']].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md">
                <div className="text-3xl font-extrabold">{value}</div><div className="mt-1 text-white/75">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="order" className="scroll-mt-24 bg-blue-50 px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Check Your Domain Name</h2>
          <p className="mt-4 text-lg text-gray-600">Instantly check if your desired domain is available.</p>
          <form action="/domains/search" className="mt-9 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-blue-100">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                <input name="q" required pattern="[^\s]+" placeholder="Enter your domain name (e.g. example.com)" className="min-w-0 flex-1 bg-transparent px-4 py-4 text-lg outline-none" />
              </div>
              <button className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-7 py-4 font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800">
                <Icon name="search" className="mr-2 inline h-5 w-5" />Check Availability
              </button>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-500">Example: example.com / myshop.bd / arman-mia.sites.bd</p>
          </form>
        </div>
      </section>

      <section id="features" className="bg-white px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl"><Icon name="star" className="mr-3 inline h-9 w-9 text-blue-600" />Why Choose SITES.BD?</h2>
            <p className="mt-4 text-lg text-gray-600">A simple subdomain and hosting platform with instant setup and practical controls.</p>
          </div>
          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className={`rounded-3xl bg-gradient-to-br p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${toneClasses[feature.tone]}`}>
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name={feature.icon} className="h-8 w-8" /></div>
                <h3 className="text-2xl font-extrabold text-gray-800">{feature.title}</h3>
                <p className="mt-4 leading-7 text-gray-600">{feature.text}</p>
                <ul className="mt-6 space-y-2 text-gray-700">
                  {feature.items.map((item) => <li key={item}>✓ <span className="ml-1">{item}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-100 px-5 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl"><Icon name="settings" className="mr-3 inline h-9 w-9 text-blue-600" />How It Works</h2>
            <p className="mt-4 text-lg text-gray-600">Get your free subdomain in just 3 simple steps.</p>
          </div>
          <div className="grid gap-7 md:grid-cols-3">
            {[['1', 'Choose Your Subdomain', 'Enter your desired subdomain name and check availability instantly.'], ['2', 'Instant Creation', 'Create your subdomain with automatic DNS configuration and immediate activation.'], ['3', 'Connect & Launch', 'Connect it to your hosting or use it with Blogger and launch your website.']].map(([num, title, text], i) => (
              <div key={num} className="rounded-2xl bg-white p-8 text-center shadow-lg transition hover:-translate-y-1">
                <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-extrabold text-white ${i === 0 ? 'bg-blue-600' : i === 1 ? 'bg-emerald-500' : 'bg-violet-600'}`}>{num}</div>
                <h3 className="text-2xl font-extrabold">{title}</h3><p className="mt-4 leading-7 text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-blue-950 px-5 py-12 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div><div className="flex items-center gap-3 text-2xl font-extrabold"><Icon name="globe" className="h-8 w-8 text-blue-400" />SITES.BD</div><p className="mt-4 leading-7 text-gray-400">A simple home for free subdomains, domains, hosting, DNS management and support.</p><DeveloperCredit className="mt-4" /></div>
          <div><h4 className="font-extrabold">Services</h4><ul className="mt-4 space-y-2 text-gray-400"><li><Link href="/domains/search" className="hover:text-white">Free Subdomains</Link></li><li><Link href="/domains/search" className="hover:text-white">Domain Search</Link></li><li><Link href="/domains/whois" className="hover:text-white">WHOIS Lookup</Link></li><li><Link href="/dashboard" className="hover:text-white">DNS Management</Link></li></ul></div>
          <div><h4 className="font-extrabold">Support</h4><ul className="mt-4 space-y-2 text-gray-400"><li><Link href="/contact" className="hover:text-white">Contact Us</Link></li><li><Link href="/dashboard/tickets" className="hover:text-white">Support Tickets</Link></li><li><Link href="/login" className="hover:text-white">Customer Login</Link></li><li><Link href="/register" className="hover:text-white">Create Account</Link></li></ul></div>
          <div><h4 className="font-extrabold">Platform</h4><ul className="mt-4 space-y-2 text-gray-400"><li><Link href="/checkout/hosting" className="hover:text-white">Hosting</Link></li><li><Link href="/cart" className="hover:text-white">Cart</Link></li><li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li><li><Link href="/domains/search" className="hover:text-white">Domain Search</Link></li></ul></div>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-7 text-center text-sm text-gray-400">© {new Date().getFullYear()} SITES.BD. All rights reserved.</div>
      </footer>
    </main>
  );
}
