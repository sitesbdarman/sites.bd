import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyTicketCreated, notifyAdmin } from "@/lib/email/notifications";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  let body: { subject?: string; message?: string; priority?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 }); }
  const subject = body.subject?.trim() ?? "";
  const message = body.message?.trim() ?? "";
  const priority = body.priority ?? "normal";
  if (subject.length < 3 || subject.length > 200) return NextResponse.json({ success: false, error: "Subject must be 3-200 characters." }, { status: 400 });
  if (message.length < 5 || message.length > 5000) return NextResponse.json({ success: false, error: "Message must be 5-5000 characters." }, { status: 400 });
  if (!["low", "normal", "high", "urgent"].includes(priority)) return NextResponse.json({ success: false, error: "Invalid priority." }, { status: 400 });
  const admin = createAdminClient();
  const { data: ticketNumber, error: numberError } = await admin.rpc("generate_ticket_number");
  if (numberError || !ticketNumber) return NextResponse.json({ success: false, error: "Couldn't create ticket number." }, { status: 500 });
  const { data, error } = await admin.from("support_tickets").insert({ customer_id: user.id, ticket_number: ticketNumber, subject, message, priority }).select("ticket_number,status").single();
  if (error) return NextResponse.json({ success: false, error: "Couldn't create your ticket." }, { status: 500 });
  if (user.email) {
    void notifyTicketCreated({ email: user.email, userId: user.id, ticketNumber: data.ticket_number, subject, priority });
  }
  void notifyAdmin(`New support ticket ${data.ticket_number}`, `A new ${priority} support ticket was created: ${subject}`, "admin_ticket_created", { ticketNumber: data.ticket_number, customerId: user.id });
  return NextResponse.json({ success: true, ticket: data });
}
