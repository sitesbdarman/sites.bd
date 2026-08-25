import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const [customRes, domainRes, invoiceRes, ticketRes] = await Promise.all([
    supabase.from("user_notifications").select("id,title,message,kind,link,is_read,created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("domains").select("id,domain_name,expires_at").eq("status", "active").lte("expires_at", new Date(Date.now() + 30*24*60*60*1000).toISOString()).gte("expires_at", new Date().toISOString()),
    supabase.from("invoices").select("id,invoice_number,total,currency").eq("status", "unpaid"),
    supabase.from("support_tickets").select("id,ticket_number,subject,status,updated_at").eq("status", "pending"),
  ]);

  const notifications: any[] = (customRes.data ?? []).map((n: any) => ({ id:`custom-${n.id}`, type:"admin_message", title:n.title, detail:n.message, href:n.link || "/dashboard", urgent:n.kind === "danger" || n.kind === "warning", createdAt:n.created_at }));
  const now = Date.now();
  for (const d of domainRes.data ?? []) {
    const daysLeft = Math.ceil((new Date(d.expires_at).getTime() - now) / 86400000);
    notifications.push({ id:`domain-${d.id}`, type:"domain_expiring", title:`${d.domain_name} expires in ${daysLeft} day${daysLeft===1?"":"s"}`, detail:"Renew to avoid losing this domain.", href:"/dashboard/domains", urgent:daysLeft<=7, createdAt:d.expires_at });
  }
  for (const i of invoiceRes.data ?? []) notifications.push({ id:`invoice-${i.id}`, type:"invoice_unpaid", title:`Invoice ${i.invoice_number} is unpaid`, detail:`${Number(i.total).toFixed(2)} ${i.currency} due.`, href:"/dashboard/invoices", urgent:false, createdAt:new Date().toISOString() });
  for (const t of ticketRes.data ?? []) notifications.push({ id:`ticket-${t.id}`, type:"ticket_reply", title:`New reply on ${t.ticket_number}`, detail:t.subject, href:`/dashboard/tickets/${t.id}`, urgent:false, createdAt:t.updated_at });
  notifications.sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const body = await request.json().catch(()=>({}));
  if (body.id) await supabase.from("user_notifications").update({ is_read:true }).eq("id", String(body.id));
  if (body.all === true) await supabase.from("user_notifications").update({ is_read:true }).eq("user_id", user.id);
  return NextResponse.json({ ok:true });
}
