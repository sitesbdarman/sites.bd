import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCoupon } from "@/lib/coupons/service";
import { getCartItems } from "@/lib/cart/queries";
import { getHostingPlanById } from "@/lib/hosting/plans";
import { getLiveAddonById, getLiveHostingPlanById, getLiveAddons } from "@/lib/hosting/catalog-server";
import { getAddonById } from "@/lib/hosting/addons";

export async function POST(request: Request) {
  const originError = assertSameOrigin(request); if (originError) return originError;
  const supabase = await createClient(); const { data:{user} } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({success:false,error:"Not authenticated."},{status:401});
  let body:any; try { body=await request.json(); } catch { return NextResponse.json({success:false,error:"Invalid request body."},{status:400}); }
  const cart = await getCartItems(supabase,user.id); if (cart.error) return NextResponse.json({success:false,error:"Couldn't load cart."},{status:500});
  const domainTotal = Math.round(cart.data.reduce((s:number,i:any)=>s+Number(i.price),0)*100)/100;
  let hostingPrice=0;
  if (body.hosting?.type !== "custom" && body.hosting?.planId) { const p=(await getLiveHostingPlanById(body.hosting.planId)) || getHostingPlanById(body.hosting.planId); if (p && p.type===body.hosting.type) hostingPrice=p.price; }
  const addonIds=Array.from(new Set(Array.isArray(body.addonIds)?body.addonIds:[]));
  const addons=(await Promise.all(addonIds.map(async (id:string)=>(await getLiveAddonById(String(id))) || getAddonById(String(id))))).filter(Boolean) as any[];
  const subtotal=Math.round((domainTotal+hostingPrice+addons.reduce((s,a)=>s+a.price,0))*100)/100;
  const quote=await checkCoupon(String(body.code||""),subtotal);
  return NextResponse.json({success:quote.valid,subtotal,discount:quote.discount,code:quote.code,message:quote.message,total:Math.max(0,Math.round((subtotal-quote.discount)*100)/100)});
}
