import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const db=createAdminClient();
  const {data,error}=await db.from("payment_settings").select("bkash_number,nagad_number,rocket_number").eq("id",true).single();
  if(error) return NextResponse.json({success:false,error:"Payment settings are not configured."},{status:500});
  return NextResponse.json({success:true,settings:data});
}
