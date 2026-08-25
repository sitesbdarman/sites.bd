import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCartAbandonment } from "@/lib/email/notifications";

/**
 * GET /api/cron/cart-abandonment
 *
 * Reminds signed-in users about domains sitting in their cart for more
 * than ABANDON_AFTER_HOURS with no reminder sent yet. One email per user
 * per run, listing every stale item in their cart. Protect with
 * CRON_SECRET the same way as /api/cron/expiry.
 */
const ABANDON_AFTER_HOURS = 24;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const cutoff = new Date(Date.now() - ABANDON_AFTER_HOURS * 60 * 60 * 1000).toISOString();

  const { data: items, error } = await db
    .from("cart_items")
    .select("id, owner_id, domain_name, created_at, abandonment_reminder_sent_at")
    .lte("created_at", cutoff)
    .is("abandonment_reminder_sent_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byOwner = new Map<string, { id: string; domain_name: string }[]>();
  for (const item of items ?? []) {
    const list = byOwner.get(item.owner_id) ?? [];
    list.push({ id: item.id, domain_name: item.domain_name });
    byOwner.set(item.owner_id, list);
  }

  let sent = 0;
  for (const [ownerId, list] of byOwner) {
    try {
      const { data: owner } = await db.auth.admin.getUserById(ownerId);
      const email = owner?.user?.email;
      if (!email) continue;

      await notifyCartAbandonment({
        email,
        userId: ownerId,
        domains: list.map((i) => i.domain_name),
      });

      await db
        .from("cart_items")
        .update({ abandonment_reminder_sent_at: new Date().toISOString() })
        .in("id", list.map((i) => i.id));
      sent++;
    } catch (e) {
      console.error("cart abandonment reminder failed for", ownerId, e);
    }
  }

  return NextResponse.json({ ok: true, usersEmailed: sent });
}
