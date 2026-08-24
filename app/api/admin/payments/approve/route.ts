import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/auth";
export async function POST(request:Request){
 const originError=assertSameOrigin(request); if(originError)return originError; const {user,admin,response}=await assertAdminApi(); if(response)return response; if(!user||!admin)return NextResponse.json({success:false,error:"Forbidden."},{status:403});
 let body:{paymentId?:string;action?:string}; try{body=await request.json();}catch{return NextResponse.json({success:false,error:"Invalid request body."},{status:400});}
 const paymentId=body.paymentId?.trim(), action=body.action?.trim().toLowerCase(); if(!paymentId||!['approve','reject'].includes(action||''))return NextResponse.json({success:false,error:"Invalid payment action."},{status:400});
 const {data:payment,error}=await admin.from("payments").select("id,order_id,invoice_id,customer_id,status").eq("id",paymentId).single(); if(error||!payment)return NextResponse.json({success:false,error:"Payment not found."},{status:404}); if(payment.status!=="pending_review")return NextResponse.json({success:false,error:`Payment is already ${payment.status}.`},{status:400});
 const now=new Date().toISOString();
 if(action==='reject'){const {error:e}=await admin.from("payments").update({status:"failed",reviewed_at:now,reviewed_by:user.id}).eq("id",payment.id);if(e)return NextResponse.json({success:false,error:"Couldn't reject payment."},{status:500});await admin.from("orders").update({status:"pending_payment"}).eq("id",payment.order_id);return NextResponse.json({success:true,status:"rejected"});}
 const {error:pe}=await admin.from("payments").update({status:"paid",paid_at:now,reviewed_at:now,reviewed_by:user.id}).eq("id",payment.id);if(pe)return NextResponse.json({success:false,error:"Couldn't approve payment."},{status:500});
 const {error:ie}=await admin.from("invoices").update({status:"paid",paid_at:now}).eq("id",payment.invoice_id);if(ie)return NextResponse.json({success:false,error:"Payment approved but invoice update failed."},{status:500});
 const {data:items}=await admin.from("order_items").select("item_type,name").eq("order_id",payment.order_id); const names=(items||[]).filter((i:any)=>i.item_type==='domain').map((i:any)=>i.name);
 if(names.length){const {error:de}=await admin.from("domains").insert(names.map((domain_name:string)=>({owner_id:payment.customer_id,domain_name,status:"active",registered_at:now})));if(de&&!String(de.message).toLowerCase().includes('duplicate')){await admin.from("orders").update({status:"processing"}).eq("id",payment.order_id);return NextResponse.json({success:true,status:"approved",warning:"Payment approved; domain activation needs attention."});}}
 await admin.from("orders").update({status:"active"}).eq("id",payment.order_id); return NextResponse.json({success:true,status:"approved"});
}
