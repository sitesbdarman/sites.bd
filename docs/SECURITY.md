# Security Checklist

- Supabase Auth sessions are used for user authentication.
- Service-role access is server-only.
- Same-origin checks are applied to sensitive browser mutation APIs.
- Ownership is checked using the authenticated user ID before domain, DNS, ticket and profile mutations.
- OTPs are stored as hashes and expire.
- DNS changes are validated server-side and can be provider-synchronized.
- RLS is enabled on user-owned tables.
- Admin actions are server-side and use an admin guard.
- Provider secrets belong in Vercel environment variables, never source control.
- Cron execution should use `CRON_SECRET` in production.
- Add external WAF/rate limiting if traffic grows beyond the current application-level rate limits.


### Staff roles
- super_admin/admin: full administration.
- support_agent: customer lookup, tickets and notifications.
- finance: orders, payments, coupons, reports and customer lookup.
API routes enforce these permissions server-side.
