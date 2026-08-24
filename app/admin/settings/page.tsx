import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentSettings } from "./payment-settings";
export default async function AdminSettingsPage(){await requireAdmin();const db=createAdminClient();const {data}=await db.from("payment_settings").select("bkash_number,nagad_number,rocket_number").eq("id",true).single();return <PaymentSettings initial={data||{bkash_number:"",nagad_number:"",rocket_number:""}}/>;}
