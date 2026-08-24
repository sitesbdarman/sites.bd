# Production Deployment Guide

## 1. Supabase
1. Create a Supabase project.
2. In SQL Editor, run database migrations in order: `0001_foundation.sql` through `0011_desec_dns_provider.sql`.
3. Copy Project URL and anon key into environment variables.
4. Copy the service-role key only to server-side deployment secrets.

## 2. Environment variables
Use `.env.local.example` as the template. Never commit `.env.local`.
Required values include Supabase URL/key, server key, app URL, SMTP settings, and optional deSEC settings.

## 3. Vercel
Import this repository into Vercel, keep the framework as Next.js, and add the same environment variables for Production/Preview as appropriate. Deploy, then open `/api/health`.

## 4. deSEC
Set `DESEC_API_TOKEN` and `DESEC_BASE_URL` only when DNS synchronization is ready. Test DNS operations with a non-critical zone first.

## 5. Email
Configure SMTP credentials in Vercel server environment variables. Send a test order/payment/ticket email before production use.

## 6. Payment
The included payment simulation is for testing. Do not advertise it as a real payment gateway. Replace it with the chosen provider's verified server-side API/webhook integration before accepting real money.

## 7. Domain registration
RDAP is used for availability/WHOIS-style lookup. Actual registration/purchase requires a registrar/reseller API and credentials; this project does not pretend RDAP can register domains.

## 8. Final smoke test
Run: `npm ci`, `npm run lint`, `npm run build`, `npm start`.
Then verify registration/login, cart, checkout, payment simulation, invoice, dashboard, DNS, ticket, admin access, and `/api/health`.
