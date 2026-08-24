import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ success: false, error: "Invoice is required." }, { status: 400 });
  const { data, error } = await supabase.from("invoices").select("id,invoice_number,status,currency,total,order_id").eq("id", id).eq("customer_id", user.id).single();
  if (error || !data) return NextResponse.json({ success: false, error: "Invoice not found." }, { status: 404 });
  return NextResponse.json({ success: true, invoice: data });
}
