import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSameOrigin } from "@/lib/security/csrf";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Current user's verification status + their most recent submission, if any. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ status: "unverified" });

  const [{ data: profile }, { data: latest }] = await Promise.all([
    supabase.from("profiles").select("identity_status, identity_rejection_reason").eq("id", user.id).maybeSingle(),
    supabase
      .from("identity_verifications")
      .select("id, doc_type, status, submitted_at, rejection_reason")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    status: profile?.identity_status ?? "unverified",
    rejectionReason: profile?.identity_rejection_reason ?? latest?.rejection_reason ?? null,
    latest: latest ?? null,
  });
}

/** Submit a new NID/passport document for admin review. */
export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  const docType = String(formData.get("docType") ?? "").trim().toLowerCase();

  if (!["nid", "passport"].includes(docType)) {
    return NextResponse.json({ error: "Choose whether this is your NID or Passport." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WEBP or PDF file." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File must be 8 MB or smaller." }, { status: 400 });
  }

  // Use the admin (service-role) client for the write path so the upload and
  // the two related table updates below happen consistently even though the
  // storage policy above would already allow the user's own client to do
  // the upload part on its own.
  const admin = createAdminClient();
  const ext = EXT_BY_TYPE[file.type] ?? "bin";
  const path = `${user.id}/${docType}-${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage.from("identity-documents").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    console.error("Identity document upload failed:", uploadError);
    return NextResponse.json({ error: "Couldn't upload your document. Please try again." }, { status: 500 });
  }

  const { error: insertError } = await admin.from("identity_verifications").insert({
    user_id: user.id,
    doc_type: docType,
    file_path: path,
    status: "pending",
  });
  if (insertError) {
    console.error("Identity verification insert failed:", insertError);
    return NextResponse.json({ error: "Couldn't submit your document for review." }, { status: 500 });
  }

  await admin
    .from("profiles")
    .update({ identity_status: "pending", identity_rejection_reason: null })
    .eq("id", user.id);

  return NextResponse.json({ ok: true, status: "pending" });
}
