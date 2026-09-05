import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hostingPlans as fallbackHosting, type HostingPlan, type HostingPlanType, CUSTOM_CONNECTION_PLAN_ID } from "./plans";
import { addonServices as fallbackAddons, type AddonService } from "./addons";
export async function getLiveHostingPlans(): Promise<HostingPlan[]> { const db=createAdminClient(); const {data}=await db.from("hosting_plans").select("id,name,type,price,billing_cycle,description,is_active,sort_order").eq("is_active",true).order("sort_order"); if(!data?.length)return fallbackHosting; return data.map((p:any)=>({id:String(p.id),type:p.type as HostingPlanType,name:p.name,price:Number(p.price||0),billingCycle:p.billing_cycle,description:p.description||"",configurable:true})); }
export async function getLiveHostingPlanById(id:string){ const plans=await getLiveHostingPlans(); return plans.find(p=>p.id===id || (id===CUSTOM_CONNECTION_PLAN_ID && p.type==="custom")); }
export async function getLiveAddons():Promise<AddonService[]> { const db=createAdminClient(); const {data}=await db.from("addons").select("id,name,description,price,currency,is_active,sort_order").eq("is_active",true).order("sort_order"); if(!data?.length)return fallbackAddons; return data.map((a:any)=>({id:String(a.id),name:a.name,description:a.description||"",price:Number(a.price||0)})); }
export async function getLiveAddonById(id:string){const items=await getLiveAddons();return items.find(a=>a.id===id);}
