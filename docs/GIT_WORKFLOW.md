# Git / Deployment Workflow

## Branches

- `source` (or `main`) — full source, migrations, docs and tests.
- `production` — deployment-ready source/build configuration.

For Vercel, the recommended approach is to deploy the production branch directly rather than committing `.next` artifacts. Vercel performs the production build itself.

## Change flow

1. Create a feature branch from `source`.
2. Implement and test the change locally.
3. Run database migrations in a disposable/staging Supabase project first.
4. Open a pull request.
5. Merge to `source` after review.
6. Promote the same commit to `production`.
7. Vercel deploys the production branch.

## Secrets

Never commit `.env.local`, Supabase service-role keys, SMTP passwords, Cloudinary secrets, DNS API tokens or registrar credentials.
