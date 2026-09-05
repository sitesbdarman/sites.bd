import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const db = await createClient();
  const [banners, faq, social, settings] = await Promise.all([
    db.from("banners").select("id,title,description,image_url,link_url,sort_order").eq("active", true).order("sort_order", { ascending: true }),
    db.from("faq_items").select("id,question,answer,sort_order").eq("active", true).order("sort_order", { ascending: true }),
    db.from("social_links").select("id,label,url,icon,sort_order").eq("active", true).order("sort_order", { ascending: true }),
    db.from("app_config").select("value").eq("key", "site_settings").maybeSingle(),
  ]);
  return NextResponse.json({ banners: banners.data ?? [], faq: faq.data ?? [], social: social.data ?? [], settings: settings.data?.value ?? {} }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
