import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { TicketsContent } from "./tickets-content";

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: tickets } = user ? await supabase.from("support_tickets").select("id,ticket_number,subject,status,priority,created_at").eq("customer_id", user.id).order("created_at", { ascending: false }) : { data: [] };
  return <DashboardLayout pageTitle="Support Tickets" userEmail={user?.email ?? null}><TicketsContent tickets={tickets ?? []} /></DashboardLayout>;
}
