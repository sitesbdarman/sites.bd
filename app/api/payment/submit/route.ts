import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success:false,error:"Not authenticated."},{status:401});
  let body: { invoiceId?:string; method?:string; senderNumber?:string; transactionId?:string };
  try { body=await request.json(); } catch { return NextResponse.json({success:false,error:"Invalid request body."},{status:400}); }
  const invoiceId=body.invoiceId?.trim(), method=body.method?.trim().toLowerCase(), senderNumber=body.senderNumber?.trim().replace(/[\s-]/g,""), transactionId=body.transactionId?.trim();
  if (!invoiceId || !method || !senderNumber || !transactionId) return NextResponse.json({success:false,error:"Payment method, sender number and transaction ID are required."},{status:400});
  if (!['bkash','nagad','rocket'].includes(method)) return NextResponse.json({success:false,error:"Select bKash, Nagad or Rocket."},{status:400});
  if (!/^(?:\+?8801|01)[3-9]\d{8}$/.test(senderNumber)) return NextResponse.json({success:false,error:"Enter a valid Bangladesh mobile number."},{status:400});
  if (transactionId.length<6 || transactionId.length>80) return NextResponse.json({success:false,error:"Enter a valid transaction ID."},{status:400});
  const admin=createAdminClient();
  const {data:invoice,error:invoiceError}=await admin.from("invoices").select("id,order_id,customer_id,status,total,currency").eq("id",invoiceId).eq("customer_id",user.id).single();
  if (invoiceError||!invoice) return NextResponse.json({success:false,error:"Invoice not found."},{status:404});
  if (invoice.status!=="unpaid") return NextResponse.json({success:false,error:`Invoice is already ${invoice.status}.`},{status:400});
  const {data:duplicate}=await admin.from("payments").select("id").eq("transaction_id",transactionId).maybeSingle();
  if (duplicate) return NextResponse.json({success:false,error:"That transaction ID has already been submitted."},{status:409});
  const {data:payment,error}=await admin.from("payments").insert({order_id:invoice.order_id,invoice_id:invoice.id,customer_id:user.id,gateway:method,transaction_id:transactionId,sender_number:senderNumber,amount:Number(invoice.total),currency:invoice.currency,status:"pending_review"}).select("id,transaction_id,status,gateway,sender_number,amount,currency").single();
  if (error||!payment) return NextResponse.json({success:false,error:"Couldn't submit payment for review."},{status:500});
  await admin.from("orders").update({status:"processing"}).eq("id",invoice.order_id).eq("customer_id",user.id);
  return NextResponse.json({success:true,payment});
}
