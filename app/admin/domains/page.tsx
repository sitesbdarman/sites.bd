import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DomainManager } from "./domain-manager";

export default async function AdminDomainsPage({ searchParams }: { searchParams: Promise<{ owner?: string }> }) {
  await requireAdmin();
  const { owner } = await searchParams;
  const db = createAdminClient();

  const [{ data: domains }, { data: owners }] = await Promise.all([
    db.from("domains").select("id,domain_name,status,auto_renew,registered_at,expires_at,owner_id").order("created_at", { ascending: false }),
    db.from("profiles").select("id,customer_id,email,full_name").order("created_at", { ascending: false }),
  ]);

  return <DomainManager initialDomains={(domains || []) as any} owners={(owners || []) as any} defaultOwnerId={owner} />;
}
