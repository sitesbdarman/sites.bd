import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SubdomainSuccessPage({ searchParams }: { searchParams: Promise<{ domain?: string }> }) {
  const { domain } = await searchParams;
  if (!domain) redirect("/");
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/subdomains/success?domain=${domain}`)}`);
  const { data: record } = await db.from("domains").select("id,domain_name").eq("owner_id", user.id).eq("domain_name", domain).maybeSingle();
  const id = record?.id;

  return <main className="min-h-screen bg-[#f7f9fc] px-4 py-10 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[var(--shadow-float)]">
        <div className="bg-slate-950 px-6 py-10 text-center text-white sm:px-10 sm:py-14">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 text-3xl ring-1 ring-emerald-300/20">✓</div>
          <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-emerald-300">Free .sites.bd</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-5xl">Your new address is ready.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">You successfully claimed <strong className="text-white">{domain}</strong>. Let’s get it connected to something useful.</p>
        </div>
        <div className="p-5 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={id ? `/dashboard/domains/${id}/dns` : "/dashboard/domains"} className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">01</p><h2 className="mt-2 font-black text-slate-950">Manage DNS <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">Add records or connect your existing website.</p></Link>
            <Link href="/dashboard/services" className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">02</p><h2 className="mt-2 font-black text-slate-950">Connect website <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">Choose hosting and take your address live.</p></Link>
            <Link href="/dashboard/email" className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">03</p><h2 className="mt-2 font-black text-slate-950">Create email <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">Explore branded email setup for your domain.</p></Link>
            <Link href={id ? `/dashboard/domains/${id}` : "/dashboard/domains"} className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">04</p><h2 className="mt-2 font-black text-slate-950">Open domain manager <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">View status, renewal and all domain controls.</p></Link>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Tip: connect DNS first if you already have a website. Need a hand? <Link href="/support/knowledge-base" className="font-bold text-blue-600 hover:text-blue-700">See setup guides →</Link></p><Link href="/dashboard" className="text-sm font-black text-blue-600 hover:text-blue-700">Go to dashboard →</Link></div>
        </div>
      </div>
    </div>
  </main>;
}
