import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { PaymentSettings } from './payment-settings';
import { SiteLogo } from '@/components/SiteLogo';

const BRANDING_ERRORS: Record<string, string> = {
  'logo-type': 'That logo file type is not supported. Use PNG, JPG, WEBP or SVG.',
  'favicon-type': 'That favicon file type is not supported. Use PNG, ICO, SVG or WEBP.',
  'logo-size': 'Logo file is too large. Please use an image under 2 MB.',
  'favicon-size': 'Favicon file is too large. Please use an image under 2 MB.',
  'upload-failed': 'Upload failed. Please check storage configuration and try again.',
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; brandingError?: string }>;
}) {
  await requireAdmin('settings:read');
  const { saved, brandingError } = await searchParams;
  const db = createAdminClient();
  const [{ data: pay }, { data: site }, { data: policies }] = await Promise.all([
    db.from('payment_settings').select('bkash_number,nagad_number,rocket_number').eq('id', true).single(),
    db.from('app_config').select('value').eq('key', 'site_settings').maybeSingle(),
    db.from('app_config').select('value').eq('key', 'policies').maybeSingle(),
  ]);
  const siteValue = (site?.value as any) || {};

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">System Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage payment channels, site information, branding, policies and maintenance mode.</p>
      </div>

      {saved === '1' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Settings saved successfully.</div>
      )}
      {saved === 'branding' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Branding updated — the new logo/favicon are now live across the site.</div>
      )}
      {brandingError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {BRANDING_ERRORS[brandingError] || 'Something went wrong updating branding.'}
        </div>
      )}

      <PaymentSettings initial={pay || { bkash_number: '', nagad_number: '', rocket_number: '' }} />

      <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-black">Branding</h2>
        <p className="mt-1 text-sm text-slate-500">Upload a logo and favicon — they update the navbar, footer, admin panel and browser tab everywhere on the site.</p>
        <form action="/api/admin/branding" method="post" encType="multipart/form-data" className="mt-4 grid gap-6 sm:grid-cols-2">
          <div className="flex items-start gap-4 rounded-xl border border-dashed border-gray-300 p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-600">
              <SiteLogo logoUrl={siteValue.logo_url} className="h-8 w-8 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <label className="block text-sm font-bold text-slate-800">Site logo</label>
              <p className="text-xs text-slate-500">PNG, JPG, WEBP or SVG, up to 2&nbsp;MB.</p>
              <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="mt-2 block w-full text-xs" />
              {siteValue.logo_url && (
                <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600">
                  <input type="checkbox" name="removeLogo" className="h-3.5 w-3.5 rounded border-red-300" />
                  Remove current logo (falls back to the default mark)
                </label>
              )}
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-dashed border-gray-300 p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
              {siteValue.favicon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={siteValue.favicon_url} alt="" className="h-8 w-8 object-contain" />
              ) : (
                <span className="text-xs text-slate-400">None</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <label className="block text-sm font-bold text-slate-800">Favicon</label>
              <p className="text-xs text-slate-500">Square PNG, ICO, SVG or WEBP, up to 2&nbsp;MB.</p>
              <input type="file" name="favicon" accept="image/png,image/webp,image/svg+xml,image/x-icon" className="mt-2 block w-full text-xs" />
              {siteValue.favicon_url && (
                <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600">
                  <input type="checkbox" name="removeFavicon" className="h-3.5 w-3.5 rounded border-red-300" />
                  Remove current favicon (falls back to the default icon)
                </label>
              )}
            </div>
          </div>
          <button className="sm:col-span-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Save branding</button>
          <p className="sm:col-span-2 text-xs text-slate-400">Tip: checking &quot;Remove&quot; clears that image even if you also pick a new file above — uncheck it if you meant to replace instead.</p>
        </form>
      </div>

      <div className="rounded-[--radius-surface] border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-black">General settings</h2>
        <form action="/api/admin/settings" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
          <input name="site_name" defaultValue={siteValue.site_name || 'SITES.BD'} placeholder="Site name" className="rounded-xl border px-4 py-3" />
          <input name="support_email" defaultValue={siteValue.support_email || ''} placeholder="Support email" className="rounded-xl border px-4 py-3" />
          <input name="support_whatsapp" defaultValue={siteValue.support_whatsapp || ''} placeholder="Support WhatsApp number" className="rounded-xl border px-4 py-3" />
          <input name="support_hours" defaultValue={siteValue.support_hours || '24/7'} placeholder="Support hours" className="rounded-xl border px-4 py-3" />
          <input name="default_currency" defaultValue={siteValue.default_currency || 'BDT'} placeholder="Default currency (BDT/USD)" className="rounded-xl border px-4 py-3" />
          <input name="default_country" defaultValue={siteValue.default_country || 'BD'} placeholder="Default country code" className="rounded-xl border px-4 py-3" />
          <input name="timezone" defaultValue={siteValue.timezone || 'Asia/Dhaka'} placeholder="Timezone" className="rounded-xl border px-4 py-3" />
          <input name="tax_label" defaultValue={siteValue.tax_label || ''} placeholder="Tax label (e.g. VAT)" className="rounded-xl border px-4 py-3" />
          <input name="tax_rate" type="number" step="0.01" min="0" defaultValue={siteValue.tax_rate || 0} placeholder="Tax rate %" className="rounded-xl border px-4 py-3" />
          <input name="support_address" defaultValue={siteValue.support_address || ''} placeholder="Support/business address" className="rounded-xl border px-4 py-3 sm:col-span-2" />
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl bg-amber-50 p-4">
            <input type="checkbox" name="maintenance" defaultChecked={Boolean(siteValue.maintenance)} />
            <span>
              <b>Maintenance mode</b>
              <span className="block text-sm text-slate-600">While on, only signed-in staff (admin/support/finance) can browse the site — everyone else sees a maintenance notice.</span>
            </span>
          </label>
          <textarea name="site_notice" defaultValue={siteValue.site_notice || ''} placeholder="Site notice (shown on the maintenance page)" className="sm:col-span-2 min-h-24 rounded-xl border px-4 py-3" />
          <textarea name="terms" defaultValue={(policies?.value as any)?.terms || ''} placeholder="Terms & Conditions" className="sm:col-span-2 min-h-32 rounded-xl border px-4 py-3" />
          <textarea name="refund" defaultValue={(policies?.value as any)?.refund || ''} placeholder="Refund policy" className="sm:col-span-2 min-h-32 rounded-xl border px-4 py-3" />
          <button className="sm:col-span-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Save settings</button>
        </form>
      </div>
    </section>
  );
}
