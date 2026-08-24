# Phase 9 — QA & Production Checklist

## Automated checks

Run from the project root after dependencies are installed:

```bash
npm ci
npm run lint
npm run build
```

The production build must be run with the same environment variable names used by deployment. Never commit real secrets.

## Manual smoke test

1. Open the home page and domain search.
2. Search an obviously valid domain and confirm the result is returned by RDAP.
3. Claim an available result and confirm it reaches the cart.
4. Log in and complete the checkout steps.
5. Confirm an order is created and an invoice is visible.
6. Use the simulation payment flow and confirm payment, invoice and order status update together.
7. Open the dashboard and verify domains, services, invoices and tickets only show the signed-in user's records.
8. Open a domain and test DNS/Name Server UI. Without deSEC credentials, local mode must not expose secrets or fail the page render.
9. Create a support ticket and confirm it appears only for the owning user.
10. Sign in as an admin and verify the admin dashboard and audit log access.
11. Sign in as a normal user and verify `/admin` is denied.
12. Open `/api/health` and verify `{ "ok": true }` with HTTP 200.
13. Check mobile layouts at a narrow viewport.
14. Confirm browser console has no uncaught application errors.

## Production checks before deployment

- Apply every SQL migration in `database/` in order.
- Configure Supabase URL and anon key.
- Configure SMTP values only in environment variables.
- Configure deSEC credentials only in environment variables.
- Configure the chosen registrar/payment provider credentials only when those integrations are enabled.
- Set the production application URL.
- Confirm Supabase RLS is enabled and policies are applied.
- Confirm admin role is assigned only to intended accounts.
- Verify backups are enabled in Supabase.
- Run `npm run lint` and `npm run build` on the deployment environment.
