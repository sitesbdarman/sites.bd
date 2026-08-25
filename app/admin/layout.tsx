import { DeveloperCredit } from "@/components/DeveloperCredit";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { LanguageToggle } from "@/components/LanguageToggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return <div className="min-h-screen bg-slate-950 text-slate-900"><div className="flex min-h-screen">
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950 text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6"><Link href="/admin" className="block"><div className="text-xl font-black tracking-tight">SITES<span className="text-sky-400">.BD</span></div><div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Admin Control Center</div></Link></div>
      <nav className="flex-1 overflow-y-auto px-4 py-5"><AdminNav /></nav>
      <div className="border-t border-white/10 p-4"><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signed in as</div><div className="mt-2 truncate text-sm font-bold text-white">{profile?.full_name || profile?.email}</div><div className="mt-1 truncate text-xs text-slate-400">{profile?.email}</div></div><Link href="/dashboard" className="mt-3 flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-[.98]">Customer Dashboard</Link></div>
    </aside>
    <main className="min-w-0 flex-1 bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"><div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"><div><Link href="/admin" className="text-lg font-black tracking-tight">SITES<span className="text-sky-500">.BD</span> <span className="text-xs font-semibold text-slate-400">ADMIN</span></Link><p className="hidden text-xs text-slate-400 sm:block">Secure administration area</p></div><div className="flex items-center gap-2"><LanguageToggle /><Link href="/" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-600 active:scale-[.98]">View site</Link></div></div></header>
      <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden"><AdminNav mobile /></div>
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center"><DeveloperCredit /></footer>
    </main>
  </div></div>;
}
