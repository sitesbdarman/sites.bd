import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await assertAdminApi("settings:read"); if (auth.response) return auth.response;
  const db = createAdminClient();
  const { data, error } = await db.from("app_config").select("key,value").in("key", ["integrations","notification_templates"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const map = Object.fromEntries((data ?? []).map((x:any)=>[x.key,x.value]));
  return NextResponse.json({ integrations: map.integrations ?? {}, templates: map.notification_templates ?? {} });
}
export async function PUT(req: Request) {
  const auth = await assertAdminApi("settings:write"); if (auth.response) return auth.response;
  const body = await req.json().catch(()=>null); if (!body) return NextResponse.json({error:"Invalid JSON."},{status:400});
  const db=createAdminClient();
  const allowed={registrar:body.integrations?.registrar||{}, payments:body.integrations?.payments||{}, email:body.integrations?.email||{}, storage:body.integrations?.storage||{}};
  const templates=body.templates||{};
  const {error}=await db.from("app_config").upsert([
    {key:"integrations",value:allowed,updated_at:new Date().toISOString()},
    {key:"notification_templates",value:templates,updated_at:new Date().toISOString()}
  ],{onConflict:"key"});
  if(error)return NextResponse.json({error:error.message},{status:500});
  await db.from("admin_audit_logs").insert({admin_id:auth.user!.id,action:"integrations_updated",entity_type:"integrations",metadata:{}});
  return NextResponse.json({ok:true,integrations:allowed,templates});
}
