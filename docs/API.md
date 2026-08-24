# SITES.BD API Reference

All mutation endpoints are same-origin protected and authenticated where noted. Responses use JSON. Sensitive provider keys stay server-side.

## Authentication

Supabase Auth session cookies are the primary authentication mechanism. Registration and password reset use the existing server-side OTP routes.

## Domain APIs

### `POST /api/domains/check`
Bulk domain availability check.

Request:
```json
{"domains":["example.com","example.bd"]}
```

### `GET /api/domains/{id}/dns`
Returns the authenticated owner's DNS records and provider configuration state.

### `POST /api/domains/{id}/dns`
Adds an A/AAAA/CNAME/MX/TXT/NS record and synchronizes to deSEC when configured.

### `DELETE /api/domains/{id}/dns?recordId=...`
Deletes a DNS record after ownership verification.

### `PATCH /api/domains/{id}/nameservers`
Updates 2–4 nameservers stored for the domain. Registrar-level nameserver delegation requires a registrar API and is intentionally not faked by the application.

### `GET /api/domains/{id}/txt`
Returns active TXT records for the owned domain.

### `POST /api/domains/{id}/txt`
Validates TXT verification records. Recognized verification names are automatically processed when the value contains the selected domain. Non-standard records return HTTP 422 with `requiresSupport: true`.

## Cart / Checkout

- `GET /api/cart`
- `POST /api/cart`
- `DELETE /api/cart/{itemId}`
- `POST /api/checkout/review`
- `POST /api/checkout/confirm`

Pricing is calculated server-side. Client-supplied totals are not trusted.

## Authentication APIs

- `POST /api/auth/register/send-otp`
- `POST /api/auth/register/verify-otp`
- `POST /api/auth/register/complete`
- `POST /api/auth/password-reset/send-otp`
- `POST /api/auth/password-reset/verify-otp`
- `POST /api/auth/password-reset/set-password`

OTP values are hashed at rest and expire server-side.

## Tickets

- `POST /api/tickets` — create ticket
- `GET /api/tickets/{id}` — owner-only ticket and reply history
- `POST /api/tickets/{id}` — owner-only reply; closed tickets are immutable

## Profile

- `GET/PATCH /api/profile`
- `POST /api/profile/complete`
- `POST /api/profile/avatar`

## Payments

- `POST /api/payment/submit`
- `GET /api/payment/settings`
- `POST /api/payment/invoice`
- `POST /api/payment/simulate`

Manual payment approvals are handled in the admin panel.

## Admin APIs

- `GET/POST/PATCH/DELETE /api/admin/coupons`
- `GET/PATCH /api/admin/payment-settings`
- `POST /api/admin/payments/approve`
- `GET /api/admin/audit`
- `GET/POST /api/admin/pricing`

All admin mutations require server-side admin authorization.

## Scheduled jobs

### `GET /api/cron/expiry`
Marks expired domains as `expired`, writes an audit/status history record, and attempts DNS cleanup through the configured provider. In production, protect this endpoint with `CRON_SECRET`.

## Standard error handling

Typical errors return:
```json
{"error":"Human readable message"}
```

Validation endpoints may additionally return `details`. Clients should always check `response.ok` before consuming success fields.
