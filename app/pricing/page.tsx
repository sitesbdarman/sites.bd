import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { DeveloperCredit } from "@/components/DeveloperCredit";

const tlds = [
  [".com", "৳1,299/yr"], [".net", "৳1,499/yr"], [".org", "৳1,399/yr"], [".info", "৳999/yr"],
  [".biz", "৳1,099/yr"], [".online", "৳899/yr"], [".site", "৳999/yr"], [".store", "৳1,499/yr"],
  [".tech", "৳1,599/yr"], [".dev", "৳1,699/yr"], [".app", "৳1,699/yr"], [".me", "৳1,299/yr"],
  [".co", "৳1,799/yr"], [".xyz", "৳799/yr"], [".cloud", "৳1,299/yr"], [".website", "৳899/yr"],
  [".shop", "৳1,199/yr"], [".pro", "৳1,399/yr"], [".live", "৳999/yr"], [".world", "৳999/yr"],
];

export default async function PricingPage() {
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
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="sticky top-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-2xl font-extrabold text-blue-600">SITES<span className="text-gray-900">.BD</span></Link>
          <div className="hidden gap-7 text-sm font-bold md:flex"><Link href="/">Home</Link><Link href="/pricing" className="text-blue-600">Pricing</Link><Link href="/contact">Contact</Link><Link href="/domains/search">Domains</Link></div>
          <ProfileMenu loggedIn={Boolean(user)} avatarUrl={profile?.avatar_url} fullName={profile?.full_name} />
        </div>
      </nav>
      <DeveloperCredit />

      <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 px-5 py-20 text-center text-white lg:py-28">
        <p className="font-bold uppercase tracking-[0.25em] text-blue-100">Domain Pricing</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">Find the right domain for your brand</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">Competitive yearly pricing across popular extensions, with domain search and checkout in one place.</p>
        <Link href="/domains/search" className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-extrabold text-blue-600 shadow-xl">Search a Domain</Link>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-emerald-50 to-blue-50 p-8 text-center shadow-sm ring-1 ring-emerald-100 sm:p-10">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-emerald-600">Always Free</p>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">SITES.BD Free Subdomain</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">Choose a name such as <strong>yourname.sites.bd</strong> and use it at no cost. No registration fee, no monthly fee, and no hidden charge.</p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            {[["৳0", "Registration"], ["৳0", "Monthly fee"], ["৳0", "Setup fee"]].map(([value, label]) => <div key={label} className="rounded-2xl bg-white p-5 text-center shadow-sm"><div className="text-2xl font-extrabold text-emerald-600">{value}</div><div className="mt-1 text-sm text-gray-500">{label}</div></div>)}
          </div>
          <Link href="/domains/search?q=example.sites.bd" className="mt-7 inline-block rounded-full bg-emerald-600 px-7 py-3.5 font-extrabold text-white shadow-lg transition hover:bg-emerald-700">Get Free Subdomain</Link>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center"><h2 className="text-3xl font-extrabold sm:text-4xl">Popular domain extensions</h2><p className="mt-3 text-gray-600">Prices shown are starting annual prices and can vary by registration, renewal, or registry fees.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tlds.map(([tld, price]) => <div key={tld} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg"><div className="text-2xl font-extrabold text-blue-600">{tld}</div><div className="mt-3 text-2xl font-extrabold">{price}</div><div className="mt-1 text-sm text-gray-500">Registration / year</div><Link href={`/domains/search?q=example${tld}`} className="mt-5 block rounded-xl bg-blue-50 py-3 text-center font-bold text-blue-700 hover:bg-blue-100">Search {tld}</Link></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8"><div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3"><div className="rounded-2xl bg-blue-50 p-7"><h3 className="text-xl font-extrabold">Easy search</h3><p className="mt-2 text-gray-600">Search your preferred name before adding it to your order.</p></div><div className="rounded-2xl bg-blue-50 p-7"><h3 className="text-xl font-extrabold">DNS management</h3><p className="mt-2 text-gray-600">Manage supported DNS records from your dashboard after setup.</p></div><div className="rounded-2xl bg-blue-50 p-7"><h3 className="text-xl font-extrabold">One dashboard</h3><p className="mt-2 text-gray-600">Keep domains, hosting, invoices and support in one account.</p></div></div></section>
    </main>
  );
}
