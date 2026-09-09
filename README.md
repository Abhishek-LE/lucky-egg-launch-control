# Lucky Egg — Launch Control (V1)

## What this is
- **Pre-Launch**: live, reads and writes the `SKU_Tasks` tab of the Product Launch: Date Management Google Sheet. Checking a task off writes back to the actual Sheet.
- **Post-Launch**: skeleton. Real SKU names/dates from Supabase, everything else empty until Nova/Neon data is wired in tomorrow.

## One-time setup (after you've created the service account and Supabase project)

1. Run `Setup_Launch_Control_Tabs.gs` once in the Google Sheet's Apps Script editor (Extensions > Apps Script > paste > select `setupLaunchControlTabs` > Run) — this creates the People, Tasks_Template, and SKU_Tasks tabs.
2. Run `supabase_schema_and_seed.sql` once in Supabase's SQL Editor — creates and seeds `post_launch_skus`.
3. Copy `.env.local.example` to `.env.local` and fill in the real values (service account email/key, Supabase URL/key).
4. `npm install`
5. `npm run dev` — check it locally at localhost:3000 before deploying.

## Deploying to Vercel

1. Push this folder to a new GitHub repo.
2. On vercel.com: New Project > Import the repo.
3. In the Vercel project's Settings > Environment Variables, add the same 4 values from `.env.local` (don't commit `.env.local` — it's gitignored).
4. Deploy. Vercel gives you a live URL.

## Notes
- The Google Sheets private key env var needs its `\n` line breaks kept literal (as they appear in the downloaded JSON) — Vercel's env var UI handles this fine, just paste the whole string.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security — it's only ever used server-side in API routes, never sent to the browser. Don't reuse it client-side.
