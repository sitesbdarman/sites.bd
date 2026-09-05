import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/security/csrf";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function cloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Please select an image." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Please choose a JPG, PNG or WEBP image." }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Profile picture must be 5 MB or smaller." }, { status: 400 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `sitesbd/avatars/${user.id}`;
    const signature = cloudinarySignature({ public_id: publicId, timestamp }, apiSecret);
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", apiKey);
    uploadData.append("timestamp", timestamp);
    uploadData.append("public_id", publicId);
    uploadData.append("signature", signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadData,
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.secure_url) {
      console.error("Cloudinary upload failed:", result);
      return NextResponse.json({ error: result?.error?.message ?? "Profile picture upload failed." }, { status: 502 });
    }

    // Cache-bust: the public_id is fixed per user, so a re-upload returns the
    // exact same secure_url as last time. Without a changing query string the
    // browser (and any CDN) keeps showing the old cached image after a new
    // upload is saved, so the picture appears not to update.
    const avatarUrl = `${String(result.secure_url)}?v=${timestamp}`;
    // Do not update profiles here. The profile form immediately follows this
    // upload with the authenticated PATCH /api/profile request, which keeps
    // avatar + name/mobile/address updates in one consistent write path.
    return NextResponse.json({ ok: true, avatarUrl, provider: "cloudinary" });
  }

  const path = `${user.id}/avatar`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    console.error("Supabase avatar upload failed:", uploadError);
    return NextResponse.json({ error: "Profile image storage is not configured. Add the Cloudinary environment variables or create the Supabase avatars bucket." }, { status: 500 });
  }

  // Same cache-busting concern as the Cloudinary branch above, plus here the
  // upload path itself already changes per upload (Date.now()), which is
  // enough on its own — but we still append ?v= for consistency with clients
  // that might normalize/cache by base path.
  const avatarUrl = `${supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  return NextResponse.json({ ok: true, avatarUrl, provider: "supabase" });
}
