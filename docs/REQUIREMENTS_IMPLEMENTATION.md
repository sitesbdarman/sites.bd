# SITES.BD Requirements Implementation

This release extends the existing SITES.BD project instead of replacing the working authentication, cart, checkout, payment-review, profile, admin, domain-search and deSEC foundations.

## Included in this release

- Fixed the profile-avatar API build error by importing the server admin client.
- Domain details route with billing/status/hosting information.
- DNS and nameserver management entry points.
- Dedicated TXT Record page with automatic validation for configured verification names and a support-required path for non-standard records.
- Service details route and service-message display foundation.
- Invoice details route.
- Ticket details route and user reply API.
- Expiry cron endpoint and Vercel cron configuration for automatic domain expiry and DNS cleanup.
- Database extension for domain status history, service messages, ticket replies, dashboard content, newsletter subscribers, app configuration and audit logs.
- Existing deSEC integration remains the active DNS provider abstraction because the project's original technical stack specified `desec.io`.

## Important provider note

The requirements contain a provider conflict: the original stack names `desec.io` while section 13 later names Cloudflare. This release keeps deSEC as the active implementation and retains provider-neutral database naming (`provider_record_id`) so a Cloudflare provider can be added without redesigning the UI or database.

## Database

Run migrations in order through `database/0018_full_requirements.sql`. The migration is additive and uses `if not exists` guards for the new structures.

## Environment

Use `.env.local` based on `.env.local.example`. Never commit service-role keys, SMTP passwords, DNS API tokens or other secrets.

For the expiry cron, set `CRON_SECRET` in Vercel. Vercel cron will call `/api/cron/expiry` and the endpoint accepts the matching Bearer token.

## Remaining production configuration

External services still require real credentials/configuration before live use: Supabase, SMTP, Cloudinary, deSEC and payment receiving settings. Domain registration/availability is provider-dependent; the current provider abstraction uses RDAP for availability/WHOIS and can be replaced with a registrar API later.
