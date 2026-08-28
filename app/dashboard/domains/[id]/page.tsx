import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TxtRecordManager } from "@/components/dashboard/TxtRecordManager";

export default async function TxtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: domain } = await db.from("domains").select("id,domain_name").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!domain) notFound();
  return <DashboardLayout pageTitle="Add TXT Record" userEmail={user.email ?? null}>
    <div className="mb-4">
      <Link href={`/dashboard/domains/${id}`} className="text-sm font-bold text-blue-600">← Back to Domain</Link>
      <h1 className="mt-2 text-2xl font-black">Add TXT Record</h1>
      <p className="mt-1 text-sm text-gray-500">Domain: {domain.domain_name}</p>
    </div>
    <TxtRecordManager domainId={id} domainName={domain.domain_name} />
  </DashboardLayout>;
}
