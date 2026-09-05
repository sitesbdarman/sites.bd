# Production integrations still requiring provider credentials

This project now has UI and application-layer fallbacks for local development, but real paid-domain registration and automatic payment verification require merchant/registrar accounts and secrets that cannot be safely invented.

Before production:
1. Configure a supported registrar API and implement its credentials in server-side environment variables.
2. Configure each payment provider and verify signed webhooks before marking orders paid.
3. Configure DESEC_API_TOKEN for live DNS provisioning.
4. Run database migrations and verify RLS policies.

Do not expose API secrets to the browser.
