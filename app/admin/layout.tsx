import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div><Link href="/admin" className="text-xl font-bold text-gray-900">DomainHost Admin</Link><p className="text-xs text-gray-500">{profile?.full_name || profile?.email || "Administrator"}</p></div>
          <Link href="/dashboard" className="rounded-md border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">User Dashboard</Link>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap gap-2">
          {[['/admin','Overview'],['/admin/users','Users'],['/admin/domains','Domains'],['/admin/orders','Orders'],['/admin/tickets','Tickets']].map(([href,label]) => <Link key={href} href={href} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50">{label}</Link>)}
        </nav>
        {children}
      </div>
    </div>
  );
}
