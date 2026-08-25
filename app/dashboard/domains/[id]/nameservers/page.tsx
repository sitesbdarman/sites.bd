import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NameserverManager } from "@/components/dashboard/NameserverManager";

export default async function NameserversPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: domain } = await db
    .from("domains")
    .select("id,domain_name,nameserver1,nameserver2,nameserver3,nameserver4")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!domain) notFound();

  const initial = [domain.nameserver1, domain.nameserver2, domain.nameserver3, domain.nameserver4].filter(
    (v): v is string => Boolean(v)
  );

  return (
    <DashboardLayout pageTitle="Name Server Management" userEmail={user.email ?? null}>
      <div className="mb-5">
        <Link href={`/dashboard/domains/${id}`} className="text-sm font-bold text-blue-600">← Back to Domain</Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Name Server Management</h1>
            <p className="mt-1 text-sm text-gray-500">Domain: {domain.domain_name}</p>
          </div>
          <Link href={`/dashboard/domains/${id}/dns`} className="rounded-xl border px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            Manage DNS Records →
          </Link>
        </div>
      </div>
      <NameserverManager domainId={id} initial={initial} />
    </DashboardLayout>
  );
}
