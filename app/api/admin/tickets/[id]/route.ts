import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/admin/auth";
import { notifyTicketReply } from "@/lib/email/notifications";

const schema = z.object({
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
  message: z.string().trim().min(1).max(5000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, admin, response } = await assertAdminApi();
  if (response) return response;

  const { id } = await params;
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  const { status, message } = body.data;
  if (!status && !message) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  if (status) {
    const { error } = await admin!
      .from("support_tickets")
      .update({ status, updated_at: new Date().toISOString(), closed_at: status === "closed" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (message) {
    const { error } = await admin!
      .from("support_ticket_replies")
      .insert({ ticket_id: id, user_id: user!.id, is_admin: true, message });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!status) {
      await admin!
        .from("support_tickets")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", id);
    }

    // Best-effort email to the ticket owner — never fails the request if
    // delivery fails, since the reply itself is already saved.
    try {
      const { data: ticket } = await admin!
        .from("support_tickets")
        .select("customer_id, ticket_number, subject")
        .eq("id", id)
        .single();
      if (ticket) {
        const { data: customer } = await admin!.auth.admin.getUserById(ticket.customer_id);
        const email = customer?.user?.email;
        if (email) {
          await notifyTicketReply({
            email,
            userId: ticket.customer_id,
            ticketNumber: ticket.ticket_number,
            subject: ticket.subject,
            message,
          });
        }
      }
    } catch (emailError) {
      console.error("ticket reply email failed:", emailError);
    }
  }

  await admin!.from("admin_audit_logs").insert({
    admin_id: user!.id,
    action: "ticket_update",
    entity_type: "ticket",
    entity_id: id,
    metadata: body.data,
  });

  return NextResponse.json({ ok: true });
}
