import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security/csrf";
import { assertAdminApi } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/x-icon", "image/svg+xml"]);

function cloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

async function uploadBrandingAsset(file: File, kind: "logo" | "favicon"): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const publicId = `sitesbd/branding/${kind}`;
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
      throw new Error(result?.error?.message ?? `${kind} upload failed.`);
    }
    // Cache-bust so the navbar/footer/admin panel pick up the new asset
    // immediately instead of showing a stale cached image at the same URL.
    return `${String(result.secure_url)}?v=${timestamp}`;
  }

  const admin = createAdminClient();
  const path = `site/${kind}-${Date.now()}.${file.type.split("/")[1]?.replace("x-icon", "ico") ?? "png"}`;
  const { error: uploadError } = await admin.storage.from("branding").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    throw new Error(
      `Branding storage is not configured. Add the Cloudinary environment variables, or create a public "branding" bucket in Supabase Storage. (${uploadError.message})`,
    );
  }
  // Cache-bust here too (path already includes Date.now(), but ?v= keeps this
  // branch consistent with the Cloudinary one above so a re-upload can never
  // appear to "not show" because of a stale cached image).
  return `${admin.storage.from("branding").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}

export async function POST(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const { user, response } = await assertAdminApi("settings:write");
  if (response) return response;

  const form = await req.formData();
  const logo = form.get("logo");
  const favicon = form.get("favicon");
  const removeLogo = form.get("removeLogo") === "on";
  const removeFavicon = form.get("removeFavicon") === "on";

  const db = createAdminClient();
  const { data: existing } = await db.from("app_config").select("value").eq("key", "site_settings").maybeSingle();
  const settings = { ...((existing?.value as Record<string, unknown>) ?? {}) };

  try {
    if (removeLogo) {
      settings.logo_url = null;
    } else if (logo instanceof File && logo.size > 0) {
      if (!ALLOWED_TYPES.has(logo.type)) {
        return NextResponse.redirect(new URL("/admin/settings?brandingError=logo-type", req.url));
      }
      if (logo.size > MAX_IMAGE_SIZE) {
        return NextResponse.redirect(new URL("/admin/settings?brandingError=logo-size", req.url));
      }
      settings.logo_url = await uploadBrandingAsset(logo, "logo");
    }

    if (removeFavicon) {
      settings.favicon_url = null;
    } else if (favicon instanceof File && favicon.size > 0) {
      if (!ALLOWED_TYPES.has(favicon.type)) {
        return NextResponse.redirect(new URL("/admin/settings?brandingError=favicon-type", req.url));
      }
      if (favicon.size > MAX_IMAGE_SIZE) {
        return NextResponse.redirect(new URL("/admin/settings?brandingError=favicon-size", req.url));
      }
      settings.favicon_url = await uploadBrandingAsset(favicon, "favicon");
    }
  } catch (err) {
    console.error("Branding upload failed:", err);
    return NextResponse.redirect(new URL("/admin/settings?brandingError=upload-failed", req.url));
  }

  await db
    .from("app_config")
    .upsert({ key: "site_settings", value: settings, updated_at: new Date().toISOString() }, { onConflict: "key" });
  await db.from("admin_audit_logs").insert({
    admin_id: user!.id,
    action: "branding_updated",
    entity_type: "settings",
    metadata: { logo_url: settings.logo_url, favicon_url: settings.favicon_url },
  });

  return NextResponse.redirect(new URL("/admin/settings?saved=branding", req.url));
}
