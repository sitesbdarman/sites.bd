# SITES.BD Admin Feature Set

## Included in this release
- Admin dashboard with operational KPIs
- Customer notification center: single customer or broadcast, in-app and optional email
- Business reports
- Customer management
- Domain management
- Orders and manual payment review
- Pricing management
- Coupon management
- Support ticket management
- Audit log endpoint
- Admin settings
- Customer dashboard settings page

## Recommended production hardening
- Replace broad service-role actions with least-privilege RPCs where practical.
- Add per-role admin permissions (super admin, billing, support, DNS, content).
- Add rate limiting to admin notification broadcasts.
- Add an approval workflow for high-impact DNS/status changes.
- Connect notification preferences to `notification_preferences` table.

## Operational upgrades
- Staff roles: super_admin/admin, support_agent, finance.
- Search/filter/export for customers, coupons and orders.
- Bulk customer status and bulk order status actions.
- Payment review UI removes completed rows without manual refresh.
- Reports add date filters, CSV export and a revenue trend.
- Audit log resolves staff name and email.
- Customer order cancellation for pending/processing orders.
- Knowledge base and WhatsApp support entry point.
- Site settings include identity, support details and maintenance mode.
