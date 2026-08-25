import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminReportsPage(){
  await requireAdmin(); const db=createAdminClient();
  const [{data:paid},{data:orders},{data:users},{data:domains},{data:payments}] = await Promise.all([
    db.from("invoices").select("total,created_at").eq("status","paid").order("created_at",{ascending:false}).limit(5000),
    db.from("orders").select("status,created_at,total").order("created_at",{ascending:false}).limit(5000),
    db.from("profiles").select("created_at,account_status").order("created_at",{ascending:false}).limit(5000),
    db.from("domains").select("status,expires_at").limit(5000),
    db.from("payments").select("status,amount,created_at").order("created_at",{ascending:false}).limit(5000),
  ]);
  // eslint-disable-next-line react-hooks/purity -- server component; computed once per request, not during a client re-render.
  const now=Date.now();
  const revenue=(paid??[]).reduce((s:number,r:{total:number|string|null})=>s+Number(r.total||0),0);
  const pendingPayments=(payments??[]).filter((p:{status:string})=>p.status==='pending_review').length;
  const expiring=(domains??[]).filter((d:{expires_at:string|null})=>d.expires_at && new Date(d.expires_at).getTime()<=now+30*86400000 && new Date(d.expires_at).getTime()>=now).length;
  const recentOrders=(orders??[]).filter((o:{created_at:string})=>new Date(o.created_at).getTime()>=now-7*86400000).length;
  return <section className="space-y-6"><div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-7 text-white shadow-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">Analytics & reports</p><h1 className="mt-2 text-3xl font-black">Business Reports</h1><p className="mt-2 text-sm text-slate-300">Operational numbers for orders, revenue, customers, domains and payments.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Revenue","BDT "+revenue.toFixed(2),"Paid invoices"],["7-day orders",recentOrders,"Orders created"],["Pending payments",pendingPayments,"Manual review queue"],["Expiring domains",expiring,"Next 30 days"]].map((x:any)=><div key={x[0]} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{x[0]}</p><p className="mt-2 text-3xl font-black text-slate-950">{x[1]}</p><p className="mt-1 text-xs text-slate-400">{x[2]}</p></div>)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black">Order status</h2><div className="mt-4 space-y-3">{Object.entries((orders??[]).reduce((m:any,o:any)=>(m[o.status]=(m[o.status]||0)+1,m),{})).map(([k,v]:any)=><div key={k} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="font-semibold text-slate-700">{k}</span><span className="font-black text-slate-950">{v}</span></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black">Customer status</h2><div className="mt-4 space-y-3">{Object.entries((users??[]).reduce((m:any,u:any)=>(m[u.account_status||'active']=(m[u.account_status||'active']||0)+1,m),{})).map(([k,v]:any)=><div key={k} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="font-semibold text-slate-700">{k}</span><span className="font-black text-slate-950">{v}</span></div>)}</div></div></div></section>
}
