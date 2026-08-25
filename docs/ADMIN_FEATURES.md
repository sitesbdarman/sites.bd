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
