import { assertAdminApi } from "@/lib/admin/auth";
import { sendEmail } from "@/lib/email/mailer";

function escapeHtml(value: string) { return value.replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c] ?? c)); }

export async function GET() {
  const { admin, response } = await assertAdminApi();
  if (response) return response;
  const { data, error } = await admin!.from("user_notifications").select("id,user_id,title,message,kind,link,is_read,created_at,created_by").order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ notifications: data ?? [] });
}

export async function POST(request: Request) {
  const { user, admin, response } = await assertAdminApi();
  if (response) return response;
  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const message = String(body.message ?? "").trim();
  const kind = String(body.kind ?? "info");
  const link = body.link ? String(body.link).trim() : null;
  const userId = body.userId ? String(body.userId) : null;
  const sendEmailFlag = Boolean(body.sendEmail);
  const broadcast = Boolean(body.broadcast);
  if (!title || !message) return Response.json({ error: "Title and message are required." }, { status: 400 });
  if (!["info", "success", "warning", "danger", "promotion"].includes(kind)) return Response.json({ error: "Invalid notification type." }, { status: 400 });
  if (!userId && !broadcast) return Response.json({ error: "Choose a customer or enable broadcast." }, { status: 400 });

  let recipients: { id: string; email: string | null; full_name: string | null }[] = [];
  if (broadcast) {
    const { data } = await admin!.from("profiles").select("id,email,full_name").neq("role", "admin").limit(5000);
    recipients = (data ?? []) as any;
  } else {
    const { data } = await admin!.from("profiles").select("id,email,full_name").eq("id", userId).maybeSingle();
    if (!data) return Response.json({ error: "Customer not found." }, { status: 404 });
    recipients = [data as any];
  }

  const rows = recipients.map((r) => ({ user_id: r.id, title, message, kind, link, created_by: user!.id }));
  const { error } = await admin!.from("user_notifications").insert(rows);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (sendEmailFlag) {
    await Promise.allSettled(recipients.filter((r) => r.email).map((r) => sendEmail({
      to: r.email!, subject: title,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px"><h2>${escapeHtml(title)}</h2><p style="white-space:pre-wrap;line-height:1.7">${escapeHtml(message)}</p>${link ? `<p><a href="${escapeHtml(link)}">Open notification</a></p>` : ""}</div>`,
      text: `${title}\n\n${message}${link ? `\n\n${link}` : ""}`
    })));
  }

  await admin!.from("admin_audit_logs").insert({ admin_id: user!.id, action: "notification_sent", entity_type: "user_notification", entity_id: null, metadata: { recipientCount: recipients.length, broadcast, sendEmail: sendEmailFlag, kind } });
  return Response.json({ ok: true, recipientCount: recipients.length });
}
