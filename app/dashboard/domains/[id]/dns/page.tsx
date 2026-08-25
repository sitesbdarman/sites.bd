import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DnsManager } from "@/components/dashboard/DnsManager";

export default async function DnsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: domain } = await db.from("domains").select("id,domain_name").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!domain) notFound();

  return (
    <DashboardLayout pageTitle="DNS Records" userEmail={user.email ?? null}>
      <div className="mb-5">
        <Link href={`/dashboard/domains/${id}`} className="text-sm font-bold text-blue-600">← Back to Domain</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">DNS Records</h1>
            <p className="mt-1 text-sm text-gray-500">Domain: {domain.domain_name}</p>
          </div>
          <Link href={`/dashboard/domains/${id}/nameservers`} className="rounded-xl border px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            Manage Nameservers →
          </Link>
        </div>
      </div>
      <DnsManager domainId={id} />
      <p className="mt-5 text-sm text-gray-500">To verify live DNS propagation, use a public DNS checker after a successful sync.</p>
    </DashboardLayout>
  );
}
