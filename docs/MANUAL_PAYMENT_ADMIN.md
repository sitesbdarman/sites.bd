# Manual payment flow

1. Run `database/0012_manual_payments.sql` in Supabase SQL Editor.
2. Run `database/0013_bootstrap_admin.sql` after replacing the placeholder email with the administrator email.
3. Add these Vercel environment variables:
   - `PAYMENT_MODE=manual`
   - `NEXT_PUBLIC_BKASH_NUMBER`
   - `NEXT_PUBLIC_NAGAD_NUMBER`
   - `NEXT_PUBLIC_ROCKET_NUMBER`
4. Customers submit the wallet method, their sender number and transaction ID.
5. Admin opens `/admin/orders` and approves/rejects the payment.
6. Approval marks the invoice paid, activates the order and creates the domain rows.

## Admin access

There is no public Admin Login button. A signed-in user must have `profiles.role = 'admin'`; only then does the normal dashboard show the **Admin Login** entry. The dashboard-only **Admin Panel** entry opens `/admin`, where all admin routes are protected by the server-side admin check.

For database setup, use `database/INSTALL_ALL.sql` to run all migrations at once, or run the numbered SQL files in order.
