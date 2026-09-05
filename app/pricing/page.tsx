import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";



export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { avatar_url: string | null; full_name: string | null; email: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const { data: plans } = await supabase
    .from("pricing_plans")
    .select("id,name,price,currency,billing_period,description,features,badge,cta_text")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data: domainPrices } = await supabase
    .from("domain_pricing")
    .select("id,tld,registration_price,renewal_price,currency")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <PublicNavbar loggedIn={Boolean(user)} avatarUrl={profile?.avatar_url} fullName={profile?.full_name} email={profile?.email ?? user?.email ?? null} />

      <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 px-5 py-20 text-center text-white lg:py-28">
        <p className="font-bold uppercase tracking-[0.25em] text-blue-100">Domain Pricing</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">Find the right domain for your brand</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">Competitive yearly pricing across popular extensions, with domain search and checkout in one place.</p>
        <Link href="/domains/search" className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-extrabold text-blue-600 shadow-xl">Search a Domain</Link>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-600">Plans & pricing</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Choose what fits your website</h2>
            <p className="mt-3 text-gray-600">Pricing is managed from the SITES.BD admin panel.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(plans ?? []).map((plan: any) => (
              <article key={plan.id} className="surface relative p-7 transition-colors hover:border-gray-300">
                {plan.badge && <span className="absolute right-5 top-5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700">{plan.badge}</span>}
                <h3 className="text-2xl font-extrabold text-gray-900">{plan.name}</h3>
                <p className="mt-2 min-h-12 text-sm text-gray-500">{plan.description}</p>
                <div className="mt-6"><span className="text-4xl font-black text-gray-950">{plan.currency} {Number(plan.price).toLocaleString()}</span><span className="ml-2 text-sm text-gray-500">/ {plan.billing_period}</span></div>
                <ul className="mt-6 space-y-2 text-sm text-gray-700">{(Array.isArray(plan.features) ? plan.features : []).map((f: string) => <li key={f}>✓ {f}</li>)}</ul>
                <Link href="/domains/search" className="mt-7 block rounded-xl bg-blue-600 py-3 text-center font-bold text-white transition hover:bg-blue-700 active:scale-[.98]">{plan.cta_text || "Get Started"}</Link>
              </article>
            ))}
          </div>
          {(!plans || plans.length === 0) && <div className="rounded-[--radius-surface] bg-emerald-50 p-8 text-center"><h3 className="text-xl font-bold text-emerald-800">SITES.BD Free Subdomain</h3><p className="mt-2 text-emerald-700">Pricing plans coming soon — check back shortly.</p></div>}
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center"><h2 className="text-3xl font-extrabold sm:text-4xl">Popular domain extensions</h2><p className="mt-3 text-gray-600">Prices shown are starting annual prices and can vary by registration, renewal, or registry fees.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(domainPrices ?? []).map((item: any) => <div key={item.id} className="surface p-6 transition-colors hover:border-gray-300"><div className="text-2xl font-extrabold text-blue-600">.{item.tld}</div><div className="mt-3 text-2xl font-extrabold">{item.currency} {Number(item.registration_price).toLocaleString()}</div><div className="mt-1 text-sm text-gray-500">Registration / year · Renewal {item.currency} {Number(item.renewal_price).toLocaleString()}</div><Link href={`/domains/search?q=example.${item.tld}`} className="mt-5 block rounded-xl bg-blue-50 py-3 text-center font-bold text-blue-700 hover:bg-blue-100">Search .{item.tld}</Link></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8"><div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3"><div className="rounded-[--radius-surface] bg-blue-50 p-7"><h3 className="text-xl font-extrabold">Easy search</h3><p className="mt-2 text-gray-600">Search your preferred name before adding it to your order.</p></div><div className="rounded-[--radius-surface] bg-blue-50 p-7"><h3 className="text-xl font-extrabold">DNS management</h3><p className="mt-2 text-gray-600">Manage supported DNS records from your dashboard after setup.</p></div><div className="rounded-[--radius-surface] bg-blue-50 p-7"><h3 className="text-xl font-extrabold">One dashboard</h3><p className="mt-2 text-gray-600">Keep domains, hosting, invoices and support in one account.</p></div></div></section>
      <PublicFooter />
    </main>
  );
}
