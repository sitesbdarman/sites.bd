import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDomainExpiring } from "@/lib/email/notifications";

/**
 * GET /api/cron/expiry-reminders
 *
 * Sends "your domain expires soon" emails at the 30/15/7-days-left
 * thresholds. Idempotent: `last_expiry_reminder_stage` on the domain row
 * tracks the smallest threshold already emailed, so re-running this job
 * (e.g. daily via a scheduler) never double-sends for the same stage.
 * Protect with CRON_SECRET the same way as /api/cron/expiry.
 */
const THRESHOLDS = [30, 15, 7] as const;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const now = Date.now();
  const maxWindow = new Date(now + THRESHOLDS[0] * 24 * 60 * 60 * 1000).toISOString();

  const { data: domains, error } = await db
    .from("domains")
    .select("id, domain_name, owner_id, expires_at, last_expiry_reminder_stage")
    .eq("status", "active")
    .lte("expires_at", maxWindow)
    .gte("expires_at", new Date(now).toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const d of domains ?? []) {
    if (!d.expires_at) continue;
    const daysLeft = Math.ceil((new Date(d.expires_at).getTime() - now) / (24 * 60 * 60 * 1000));
    const stage = THRESHOLDS.find((t) => daysLeft <= t);
    if (!stage) continue;

    const alreadySent = d.last_expiry_reminder_stage ?? Infinity;
    if (stage >= alreadySent) continue; // already emailed at this or an earlier (smaller) threshold

    try {
      const { data: owner } = await db.auth.admin.getUserById(d.owner_id);
      const email = owner?.user?.email;
      if (email) {
        await notifyDomainExpiring({
          email,
          userId: d.owner_id,
          domain: d.domain_name,
          daysLeft,
          expiresAt: new Date(d.expires_at).toLocaleDateString(),
        });
        await db.from("domains").update({ last_expiry_reminder_stage: stage }).eq("id", d.id);
        sent++;
      }
    } catch (e) {
      console.error("expiry reminder failed for", d.domain_name, e);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
