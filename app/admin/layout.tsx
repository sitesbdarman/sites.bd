import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AdminSidebarNav, AdminMobileNav } from "@/components/admin/AdminNav";
import { SiteLogo } from "@/components/SiteLogo";
import { LogoutButton } from "@/app/dashboard/logout-button";
import { getSiteSettings } from "@/lib/site-settings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950 text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link href="/admin" className="group flex items-center gap-2.5">
              <SiteLogo logoUrl={settings.logo_url} className="h-7 w-7 text-sky-400" />
              <div>
                {settings.site_name ? (
                  <div className="text-xl font-black tracking-tight font-display">{settings.site_name}</div>
                ) : (
                  <div className="text-xl font-black tracking-tight font-display">SITES<span className="text-sky-400">.BD</span></div>
                )}
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Admin Control Center</div>
              </div>
            </Link>
          </div>
          <AdminSidebarNav />
          <div className="border-t border-white/10 p-4">
            <div className="rounded-[--radius-surface] bg-white/5 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Signed in as</div>
              <div className="mt-2 truncate text-sm font-bold text-white">{profile?.full_name || profile?.email}</div>
              <div className="mt-1 truncate text-xs text-slate-400">{profile?.email}</div>
            </div>
            <Link href="/dashboard" className="mt-3 flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-[.98]">Customer Dashboard</Link>
            <div className="mt-2 [&_button]:w-full [&_button]:rounded-xl [&_button]:border-white/10 [&_button]:bg-transparent [&_button]:text-slate-300 [&_button]:hover:bg-white/10 [&_button]:hover:text-white">
              <LogoutButton variant="full" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-slate-50">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <AdminMobileNav />
                <Link href="/admin" className="text-lg font-black tracking-tight font-display">SITES<span className="text-sky-500">.BD</span> <span className="text-xs font-semibold text-slate-400">ADMIN</span></Link>
              </div>
              <div className="hidden lg:block text-sm font-semibold text-slate-500">Administration / Secure area</div>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <Link href="/" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600 active:scale-[.98]">View site</Link>
                <div className="lg:hidden">
                  <LogoutButton variant="icon" />
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
