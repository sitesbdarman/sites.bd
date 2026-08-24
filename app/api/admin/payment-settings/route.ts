import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request){
 const originError=assertSameOrigin(request); if(originError)return originError;
 await requireAdmin(); let b:any; try{b=await request.json();}catch{return NextResponse.json({success:false,error:"Invalid request body."},{status:400});}
 const clean=(v:any)=>String(v??"").trim().replace(/[\s-]/g,"");
 const values={bkash_number:clean(b.bkash_number),nagad_number:clean(b.nagad_number),rocket_number:clean(b.rocket_number)};
 for(const [name,value] of Object.entries(values)){if(value && !/^(?:\+?8801|01)[3-9]\d{8}$/.test(value))return NextResponse.json({success:false,error:`Invalid ${name.replace("_number","")} number.`},{status:400});}
 const db=createAdminClient(); const {data,error}=await db.from("payment_settings").upsert({id:true,...values,updated_at:new Date().toISOString()}).select().single();
 if(error)return NextResponse.json({success:false,error:error.message},{status:400});
 return NextResponse.json({success:true,settings:data});
}
