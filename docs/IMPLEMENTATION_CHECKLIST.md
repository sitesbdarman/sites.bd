# Implementation Checklist

### Already present in base project
- Supabase email/password login
- Google login callback
- Registration OTP and password reset OTP
- Guest + authenticated cart
- Checkout hosting/add-on/review/payment flows
- Domain search + RDAP availability/WHOIS abstraction
- User profile + avatar upload
- Admin login/dashboard/pricing/coupons/manual-payment review
- deSEC DNS API abstraction
- Email notification foundation

### Added in this release
- Domain details page
- TXT record workflow with automatic vs support-required validation
- Service details page
- Invoice details page
- Ticket details + reply API
- Domain expiry cron + DNS cleanup attempt
- Domain status history / service message / ticket reply / dashboard content / newsletter / app-config / audit database extension
- Admin subdomain rewrite support
- API, security and Git workflow documentation

### External setup still required before production
- Real Supabase project + migrations
- SMTP credentials
- Cloudinary credentials if media upload is used
- deSEC token for DNS synchronization
- Registrar API for real domain registration/claim/purchase
- Payment gateway or confirmed manual-payment workflow
- Production Vercel environment variables
- DNS delegation for the admin subdomain
