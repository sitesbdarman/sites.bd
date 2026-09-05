import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerificationReviewList } from "./verification-review-list";

export default async function AdminVerificationsPage() {
  await requireAdmin("customers:write");
  const db = createAdminClient();

  const { data: rows } = await db
    .from("identity_verifications")
    .select("id, user_id, doc_type, file_path, status, submitted_at, reviewed_at, rejection_reason")
    .eq("status", "pending")
    .order("submitted_at", { ascending: false })
    .limit(200);

  const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await db.from("profiles").select("id, full_name, email, customer_id").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; customer_id: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const initialItems = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await db.storage.from("identity-documents").createSignedUrl(row.file_path, 60 * 10);
      const profile = profileById.get(row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        customerId: profile?.customer_id ?? null,
        fullName: profile?.full_name ?? null,
        email: profile?.email ?? null,
        docType: row.doc_type,
        status: row.status,
        submittedAt: row.submitted_at,
        fileUrl: signed?.signedUrl ?? null,
      };
    }),
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Account Verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review customer-submitted NID/Passport documents and approve or reject their account verification.
        </p>
      </div>
      <VerificationReviewList initialItems={initialItems as any} />
    </section>
  );
}
