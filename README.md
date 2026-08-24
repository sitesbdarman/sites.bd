# SITES.BD Fixed Project

This is a clean runnable Next.js reconstruction/fix package based on the project
requirements and code supplied in this conversation. It is **not a byte-for-byte
copy of the private Vercel/GitHub repository**, because the original repository
source was not attached.

## Included fixes
- Profile normal-field update no longer gets blocked by the immutable-field trigger.
- Profile avatar URL is saved to `profiles.avatar_url`.
- Cloudinary upload route with 5 MB and image-type validation.
- Footer credit: `Developed by RA Fahim` with a sky-blue Facebook link and no underline.
- Pricing management page scaffold.
- Supabase pricing migration scaffold.
- Responsive UI and basic interaction states.

## Run
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Fill Supabase and Cloudinary variables.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open http://localhost:3000.

## Supabase
Run `supabase/profile_fix.sql` first.

The existing project has had different profile column names in screenshots
(`mobile_number`) while the supplied requirements describe `phone` and
`avatar_url`. Therefore this package uses `avatar_url` and `phone` only where
the supplied schema supports them; verify your live schema before applying
additional migrations.

## Important
The pricing admin page included here is a safe UI scaffold using local storage.
For production, connect it to the `pricing_plans` table and protect write
operations with your verified admin authorization/RLS policy.

Do not commit `.env.local` or Cloudinary/Supabase secrets.
