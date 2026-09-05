import { NextResponse } from 'next/server';
import { assertSameOrigin } from '@/lib/security/csrf';
import { assertAdminApi } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  const oe = assertSameOrigin(req);
  if (oe) return oe;
  const { user, response } = await assertAdminApi('settings:write');
  if (response) return response;

  const f = await req.formData();
  const db = createAdminClient();

  // Merge onto the existing blob so fields this form doesn't own (logo_url,
  // favicon_url — set from the Branding form) are never wiped out here.
  const { data: existing } = await db.from('app_config').select('value').eq('key', 'site_settings').maybeSingle();
  const previous = (existing?.value as Record<string, unknown>) ?? {};

  const site = {
    ...previous,
    site_name: String(f.get('site_name') || 'SITES.BD'),
    support_email: String(f.get('support_email') || ''),
    support_whatsapp: String(f.get('support_whatsapp') || ''),
    support_hours: String(f.get('support_hours') || '24/7'),
    default_currency: String(f.get('default_currency') || 'BDT').toUpperCase(),
    default_country: String(f.get('default_country') || 'BD'),
    timezone: String(f.get('timezone') || 'Asia/Dhaka'),
    tax_label: String(f.get('tax_label') || ''),
    tax_rate: Number(f.get('tax_rate') || 0),
    support_address: String(f.get('support_address') || ''),
    maintenance: f.get('maintenance') === 'on',
    site_notice: String(f.get('site_notice') || ''),
  };
  const policies = { terms: String(f.get('terms') || ''), refund: String(f.get('refund') || '') };

  await db.from('app_config').upsert(
    [
      { key: 'site_settings', value: site, updated_at: new Date().toISOString() },
      { key: 'policies', value: policies, updated_at: new Date().toISOString() },
    ],
    { onConflict: 'key' },
  );
  await db.from('admin_audit_logs').insert({
    admin_id: user!.id,
    action: 'settings_updated',
    entity_type: 'settings',
    metadata: { maintenance: site.maintenance },
  });
  return NextResponse.redirect(new URL('/admin/settings?saved=1', req.url));
}
