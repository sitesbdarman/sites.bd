import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type SiteSettings = {
  site_name?: string;
  logo_url?: string;
  favicon_url?: string;
  site_notice?: string;
  support_email?: string;
  support_whatsapp?: string;
  maintenance?: boolean;
};

/**
 * Reads the `site_settings` row from `app_config`. Wrapped in React's
 * `cache()` so multiple server components rendering in the same request
 * (navbar, footer, layout metadata, etc.) share one query instead of each
 * hitting the database separately.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const db = await createClient();
    const { data } = await db.from("app_config").select("value").eq("key", "site_settings").maybeSingle();
    return (data?.value as SiteSettings | null) ?? {};
  } catch {
    return {};
  }
});
