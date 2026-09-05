import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/auth";

const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes — plenty for an admin to open and view the document.

export async function GET(request: Request) {
  const { admin, response } = await assertAdminApi("customers:write");
  if (response) return response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending";

  let query = admin!
    .from("identity_verifications")
    .select("id, user_id, doc_type, file_path, status, submitted_at, reviewed_at, rejection_reason")
    .order("submitted_at", { ascending: false })
    .limit(200);
  if (status !== "all") query = query.eq("status", status);

  const { data: rows, error } = await query;
  if (error) return NextResponse.json({ error: "Couldn't load verification requests." }, { status: 500 });

  const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await admin!.from("profiles").select("id, full_name, email, customer_id").in("id", userIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null; customer_id: string | null }[] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const items = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: signed } = await admin!.storage
        .from("identity-documents")
        .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS);
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
        reviewedAt: row.reviewed_at,
        rejectionReason: row.rejection_reason,
        fileUrl: signed?.signedUrl ?? null,
      };
    }),
  );

  return NextResponse.json({ items });
}
