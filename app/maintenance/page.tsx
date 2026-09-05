import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SiteSettings = {
  site_name?: string;
  site_notice?: string;
  support_email?: string;
  support_whatsapp?: string;
  maintenance?: boolean;
};

export default async function MaintenancePage() {
  const db = await createClient();
  const { data } = await db
    .from("app_config")
    .select("value")
    .eq("key", "site_settings")
    .maybeSingle();

  const settings = (data?.value as SiteSettings | null) ?? {};

  // Maintenance is already off — don't strand visitors on this page.
  if (!settings.maintenance) {
    redirect("/");
  }

  const siteName = settings.site_name || "SITES.BD";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5">
      <div className="w-full max-w-lg rounded-[--radius-surface] border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
          🛠️
        </div>
        <h1 className="mt-6 text-2xl font-black text-slate-900">We&apos;ll be right back</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          {settings.site_notice ||
            `${siteName} is undergoing scheduled maintenance right now. We're working to bring things back online as quickly as possible — thanks for your patience.`}
        </p>

        {(settings.support_email || settings.support_whatsapp) && (
          <div className="mt-6 space-y-1 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Need urgent help?</p>
            {settings.support_email && (
              <p>
                Email:{" "}
                <a href={`mailto:${settings.support_email}`} className="font-medium text-blue-600 hover:underline">
                  {settings.support_email}
                </a>
              </p>
            )}
            {settings.support_whatsapp && (
              <p>
                WhatsApp:{" "}
                <a
                  href={`https://wa.me/${settings.support_whatsapp.replace(/[^\d]/g, "")}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {settings.support_whatsapp}
                </a>
              </p>
            )}
          </div>
        )}

        <Link
          href="/admin/login"
          className="mt-8 inline-block text-xs font-semibold text-gray-400 hover:text-gray-600"
        >
          Staff login
        </Link>
      </div>
    </main>
  );
}
