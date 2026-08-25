import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const guard = await assertAdminApi(); if (guard.response) return guard.response;
  let b:any; try { b=await request.json(); } catch { return NextResponse.json({success:false,error:"Invalid request body."},{status:400}); }
  const code=String(b.code||"").trim().toUpperCase(); const type=String(b.discountType||""); const value=Number(b.discountValue);
  if(!/^[A-Z0-9_-]{3,40}$/.test(code)) return NextResponse.json({success:false,error:"Coupon code must be 3-40 letters, numbers, _ or -."},{status:400});
  if(!["percent","fixed"].includes(type) || !Number.isFinite(value) || value<=0 || (type==="percent"&&value>100)) return NextResponse.json({success:false,error:"Invalid discount."},{status:400});
  const db=createAdminClient(); const {data,error}=await db.from("coupons").insert({code,discount_type:type,discount_value:value,min_order_amount:Number(b.minOrderAmount||0),max_discount_amount:b.maxDiscountAmount===""||b.maxDiscountAmount==null?null:Number(b.maxDiscountAmount),starts_at:b.startsAt||null,ends_at:b.endsAt||null,usage_limit:b.usageLimit===""||b.usageLimit==null?null:Number(b.usageLimit),active:b.active!==false}).select().single();
  if(error) return NextResponse.json({success:false,error:error.message},{status:400});
  return NextResponse.json({success:true,coupon:data});
}

export async function PATCH(request: Request) {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const guard = await assertAdminApi(); if (guard.response) return guard.response; let b:any; try { b=await request.json(); } catch { return NextResponse.json({success:false,error:"Invalid request body."},{status:400}); }
  const id=String(b.id||""); if(!id) return NextResponse.json({success:false,error:"Coupon id required."},{status:400});
  const update:any={}; for(const k of ["code","discount_type","discount_value","min_order_amount","max_discount_amount","starts_at","ends_at","usage_limit","active"]){ if(k in b) update[k]=b[k]; }
  if(typeof update.code==="string") update.code=update.code.trim().toUpperCase();
  const db=createAdminClient(); const {data,error}=await db.from("coupons").update(update).eq("id",id).select().single();
  if(error) return NextResponse.json({success:false,error:error.message},{status:400});
  return NextResponse.json({success:true,coupon:data});
}

export async function DELETE(request: Request) {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const guard = await assertAdminApi(); if (guard.response) return guard.response; const id=new URL(request.url).searchParams.get("id"); if(!id) return NextResponse.json({success:false,error:"Coupon id required."},{status:400});
  const db=createAdminClient(); const {error}=await db.from("coupons").delete().eq("id",id); if(error) return NextResponse.json({success:false,error:error.message},{status:400});
  return NextResponse.json({success:true});
}
