# Production Security Setup

## 1. Create Supabase Auth users

Create one Auth user for each app user in Supabase Dashboard:

- `admin@example.com`
- `bat@example.com`
- `sarnai@example.com`
- `bat.sales@example.com`

Use strong passwords. After these users exist, set `requireAuth: true` in `supabase-config.js`.

## 2. Apply RLS policies

Run `supabase-schema.sql` in the Supabase SQL editor. The policies only allow authenticated users to read and update `app_state`.

## 3. Deploy

Push the updated files to `main` so Vercel deploys them.

## 4. Verify

- Open the deployed Vercel URL in a private browser window.
- Confirm unauthenticated users cannot read `app_state` from Supabase.
- Log in with a Supabase Auth user.
- Create or edit a small record and confirm the change is saved in `app_state`.

## Notes

The current app stores all operational data in one `app_state` JSON document. This is acceptable for a small internal prototype, but the next security upgrade should split data into tables such as `orders`, `products`, `customers`, and `profiles`, then add role-specific RLS policies.
