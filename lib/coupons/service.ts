import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type CouponQuote = { valid: boolean; discount: number; code: string | null; message: string };

export async function checkCoupon(code: string, orderTotal: number): Promise<CouponQuote> {
  const db = createAdminClient();
  const { data: coupon, error } = await db.from("coupons").select("code,discount_type,discount_value,min_order_amount,max_discount_amount,starts_at,ends_at,usage_limit,usage_count,active").ilike("code", code.trim()).maybeSingle();
  if (error || !coupon) return { valid: false, discount: 0, code: null, message: "Coupon code not found." };
  const now = Date.now();
  if (!coupon.active) return { valid:false, discount:0, code:coupon.code, message:"This coupon is disabled." };
  if (coupon.starts_at && now < Date.parse(coupon.starts_at)) return { valid:false, discount:0, code:coupon.code, message:"This coupon is not active yet." };
  if (coupon.ends_at && now > Date.parse(coupon.ends_at)) return { valid:false, discount:0, code:coupon.code, message:"This coupon has expired." };
  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) return { valid:false, discount:0, code:coupon.code, message:"This coupon has reached its usage limit." };
  if (orderTotal < Number(coupon.min_order_amount)) return { valid:false, discount:0, code:coupon.code, message:`Minimum order amount is ${Number(coupon.min_order_amount).toFixed(2)} BDT.` };
  let d = coupon.discount_type === "percent" ? orderTotal * Number(coupon.discount_value) / 100 : Number(coupon.discount_value);
  if (coupon.max_discount_amount != null) d = Math.min(d, Number(coupon.max_discount_amount));
  d = Math.max(0, Math.min(orderTotal, Math.round(d * 100) / 100));
  return { valid:true, discount:d, code:coupon.code, message:"Coupon applied." };
}
