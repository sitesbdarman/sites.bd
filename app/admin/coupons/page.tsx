import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CouponManager } from "./coupon-manager";

export default async function AdminCouponsPage(){
  await requireAdmin();
  const db=createAdminClient();
  const {data}=await db.from("coupons").select("id,code,discount_type,discount_value,min_order_amount,max_discount_amount,starts_at,ends_at,usage_limit,usage_count,active,created_at").order("created_at",{ascending:false});
  return <CouponManager initialCoupons={data||[]}/>;
}
