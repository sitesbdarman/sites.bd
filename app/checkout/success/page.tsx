import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/dashboard");
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/success?order=${orderId}`)}`);

  const { data: order } = await db.from("orders").select("id,order_number,status,total,currency").eq("id", orderId).eq("customer_id", user.id).maybeSingle();
  if (!order) redirect("/dashboard/orders");

  const { data: items } = await db.from("order_items").select("name,item_type").eq("order_id", order.id);
  const domainItems = (items ?? []).filter((i) => i.item_type === "domain");
  const primaryDomain = domainItems[0]?.name;
  const { data: domainRecord } = primaryDomain ? await db.from("domains").select("id").eq("owner_id", user.id).eq("domain_name", primaryDomain).maybeSingle() : { data: null };

  return <main className="min-h-screen bg-[#f7f9fc] px-4 py-10 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[var(--shadow-float)]">
        <div className="bg-slate-950 px-6 py-10 text-center text-white sm:px-10 sm:py-14">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 text-3xl ring-1 ring-emerald-300/20">✓</div>
          <p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-emerald-300">Thank you</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-5xl">Order {order.order_number} is live.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            {domainItems.length > 0 ? <>Your order for <strong className="text-white">{domainItems.map((d) => d.name).join(", ")}</strong> is confirmed and activated.</> : <>Your order is confirmed and activated.</>} No payment was due — total came to {order.currency} {Number(order.total).toFixed(2)}.
          </p>
        </div>
        <div className="p-5 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.14em] text-slate-400">What&apos;s next</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link href={domainRecord?.id ? `/dashboard/domains/${domainRecord.id}/dns` : "/dashboard/domains"} className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">01</p><h2 className="mt-2 font-black text-slate-950">Manage DNS <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">Add records or connect your existing website.</p></Link>
            <Link href="/dashboard/services" className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">02</p><h2 className="mt-2 font-black text-slate-950">Connect website <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">Choose hosting and take your address live.</p></Link>
            <Link href="/dashboard/orders" className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">03</p><h2 className="mt-2 font-black text-slate-950">View order <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">See the full order summary and receipt.</p></Link>
            <Link href="/support/knowledge-base" className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/30"><p className="text-xs font-black uppercase tracking-[.14em] text-blue-600">04</p><h2 className="mt-2 font-black text-slate-950">Setup guides <span className="text-blue-600">→</span></h2><p className="mt-1 text-sm leading-5 text-slate-500">Step-by-step DNS, hosting and email guides.</p></Link>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Need a hand? <Link href="/dashboard/tickets" className="font-bold text-blue-600 hover:text-blue-700">Contact support →</Link></p><Link href="/dashboard" className="text-sm font-black text-blue-600 hover:text-blue-700">Go to dashboard →</Link></div>
        </div>
      </div>
    </div>
  </main>;
}
