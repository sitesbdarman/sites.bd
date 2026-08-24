import Link from "next/link";

const tlds = [
  [".com", "৳1,299/yr"], [".net", "৳1,499/yr"], [".org", "৳1,399/yr"], [".info", "৳999/yr"],
  [".biz", "৳1,099/yr"], [".online", "৳899/yr"], [".site", "৳999/yr"], [".store", "৳1,499/yr"],
  [".tech", "৳1,599/yr"], [".dev", "৳1,699/yr"], [".app", "৳1,699/yr"], [".me", "৳1,299/yr"],
  [".co", "৳1,799/yr"], [".xyz", "৳799/yr"], [".cloud", "৳1,299/yr"], [".website", "৳899/yr"],
  [".shop", "৳1,199/yr"], [".pro", "৳1,399/yr"], [".live", "৳999/yr"], [".world", "৳999/yr"],
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="sticky top-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-2xl font-extrabold text-blue-600">SITES<span className="text-gray-900">.BD</span></Link>
          <div className="hidden gap-7 text-sm font-bold md:flex"><Link href="/">Home</Link><Link href="/pricing" className="text-blue-600">Pricing</Link><Link href="/contact">Contact</Link><Link href="/domains/search">Domains</Link></div>
          <Link href="/register" className="rounded-full bg-blue-600 px-5 py-2.5 font-bold text-white">Get Started</Link>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 px-5 py-20 text-center text-white lg:py-28">
        <p className="font-bold uppercase tracking-[0.25em] text-blue-100">Domain Pricing</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-6xl">Find the right domain for your brand</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">Competitive yearly pricing across popular extensions, with domain search and checkout in one place.</p>
        <Link href="/domains/search" className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-extrabold text-blue-600 shadow-xl">Search a Domain</Link>
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
