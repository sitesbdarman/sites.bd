# Coupons

Coupons are managed only by admins from `/admin/coupons`.

Supported fields:
- code
- percentage or fixed BDT discount
- minimum order amount
- optional maximum discount
- optional start/end time
- optional usage limit
- enable/disable

Customers enter the coupon during checkout review. The server recalculates the
subtotal and validates the coupon; the final order/invoice total is calculated
server-side. Redemption is counted only during order confirmation.

Run `database/0014_coupons.sql` (or the updated `database/INSTALL_ALL.sql`) in Supabase before using coupons.
