import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin } from "@/lib/security/csrf";

const schema=z.object({label:z.string().trim().toLowerCase().min(3,"Use at least 3 characters.").max(63,"Use 63 characters or fewer.").regex(/^(?!-)[a-z0-9-]+(?<!-)$/,"Use letters, numbers and hyphens only.")});
const reserved=new Set(["www","mail","api","admin","support","help","status","blog","shop","app","dashboard","account","login","register","sites"]);

export async function POST(request:Request){
  const csrf=assertSameOrigin(request); if(csrf) return csrf;
  let body:unknown; try{body=await request.json()}catch{return NextResponse.json({success:false,error:"Invalid request."},{status:400})}
  const parsed=schema.safeParse(body); if(!parsed.success)return NextResponse.json({success:false,error:parsed.error.issues[0]?.message||"Invalid name."},{status:400});
  const label=parsed.data.label; if(reserved.has(label)) return NextResponse.json({success:false,error:"That name is reserved."},{status:409});
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({success:false,error:"Sign in to claim your free address."},{status:401});
  const { data, error } = await supabase.rpc("claim_free_sitesbd_subdomain", { p_label: label });
  if (error) {
    const message = error.message.includes("already claimed") ? "That address is already taken." : "Could not claim this address. Please try again.";
    return NextResponse.json({ success:false, error:message }, { status:error.message.includes("already claimed") ? 409 : 500 });
  }
  return NextResponse.json({ success:true, domain:data });
}
