# Lucky Egg — Launch Control

## What this is
Internal dashboard for Lucky Egg's product launch process, replacing/complementing
the Monday.com "Product Launch" board (board ID 5091198726). Two views:

- **Pre-Launch**: checklist tracking per SKU with a weighted readiness score.
- **Post-Launch**: sales/review/stage tracking per SKU after it goes live.

Built with the person (Abhishek), who has never coded before this project — keep
explanations concrete and step-by-step, don't assume familiarity with tooling.

## Architecture

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind, hosted on Vercel | Standard, matches what he was told to use |
| Pre-Launch data | Google Sheets (service account, read + write) | Sheet already existed with related automation; team is comfortable editing Sheets directly |
| Post-Launch data | Supabase (Postgres), fresh project | Sheets isn't a good fit for larger analytical/time-series data; Supabase is free-tier, low-maintenance |
| Auth to both | Server-side only, via Next.js API routes | Credentials never reach the browser bundle |

**Deliberate decision**: Pre-Launch checklist data lives natively in the Sheet now
(migrated one-time from Monday's real task templates), not synced live from Monday.
Monday's own "Arrival Date by SKU" sync script is untouched and unrelated.

## Key identifiers

- Google Sheet: "Product Launch: Date Management", ID `15qxKe3KPVB7nyLFLghJeRq9II7Xi9Rfr3TnU18NrMPY`
  - Tabs this project added: `People`, `Tasks_Template`, `SKU_Tasks`
  - Tabs that predate this project, do not touch: `Arrival Date by SKU` (has its own onEdit trigger + 30-min sync to Monday + Slack webhook), shipment/COGS tabs
- Supabase table: `post_launch_skus` (schema in `supabase_schema_and_seed.sql`)
- GitHub: `https://github.com/Abhishek-LE/lucky-egg-launch-control`
- Vercel: `lucky-egg-launch-control.vercel.app`
- Local project folder: `~/Desktop/lucky-egg-launch-control`

## Current status (updated 2026-09-09)

**Confirmed working, tested locally:**
- Pre-Launch page reads real SKU + checklist data from the Sheet
- Weighted readiness scoring (critical tasks 3x, but only for SKUs launching within
  90 days — further-out SKUs score flat 1x) — logic lives client-side in
  `app/pre-launch/page.tsx`, recomputes live as checkboxes toggle
- Checkbox toggle writes back to the Sheet via `PATCH /api/tasks` — confirmed via
  200 responses and manual sheet inspection
- Post-Launch page reads real SKU identity (23 launched SKUs) from Supabase,
  correctly flags `is_placeholder = true` rows
- `npm run dev` runs clean, `npm run build` / `next build` succeeds with zero errors
- Pushed to GitHub, Vercel build succeeds (confirmed via live error page rendering
  correctly, meaning the Next.js app itself deployed fine)
- **Vercel production env vars added and redeployed (2026-09-09)** — all 5 vars
  (`GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
  added via Vercel CLI to Production environment; build passed clean, aliased to
  `lucky-egg-launch-control.vercel.app`.

**Not done yet — pick up here:**
1. ~~Vercel production environment variables~~ — DONE (2026-09-09)
2. Visual design has NOT been ported yet. There's an approved design direction
   (dark sidebar, indigo accent, gradient meter bars instead of plain percentages,
   stage tracker with passed/current/future states) that was prototyped as a
   standalone React artifact earlier in the project but never rebuilt into this
   real Next.js codebase. Current pages are functional but visually plain.
3. Reviews page (dedicated view, not just embedded in Post-Launch detail) — not built.
4. Post-launch stage progression logic (Amazon 3-stage and TikTok Shop 3-stage
   price/ROS progression, per the SOP: Amazon stages at 200/300/500 units sold with
   -25%/-15%/RRP pricing; TikTok at either a -50% or -25% strategy with different
   unit/price breakpoints; 10-day-at-pass-rate rule to advance stages) — this logic
   existed in the earlier mock prototype but isn't wired to real Supabase data yet,
   since real sales data hasn't landed.
5. Real post-launch metrics (sales, reviews, PPC) are still empty/placeholder,
   pending data from Nova (sales platform) — Veer was expected to help source this.
   When that lands, it needs a sync path into `post_launch_skus` (or a new related
   table) — no script written for this yet, format of Nova's data unknown.

## Known gotchas from this build (avoid repeating these)

- **Google service account private key formatting** is the single biggest recurring
  issue. In `.env.local` it must be ONE line, wrapped in quotes, with literal `\n`
  two-character sequences (not real line breaks) — code does
  `.replace(/\\n/g, "\n")` to convert at runtime. When adding to Vercel via the
  dashboard UI (not CLI), paste only the value *between* the quotes — Vercel doesn't
  strip surrounding quote characters the way local env parsing does. When adding via
  CLI (vercel env add), the value should be passed with actual newlines (use
  printf '%b' or Python's .replace('\\n', '\n') to convert before piping).
- **Terminal working directory**: this person's terminal repeatedly defaulted to
  `~/Desktop` or `~` instead of the project folder. Always confirm with `pwd` before
  assuming commands will work, especially after opening a new terminal tab.
- **npm cache ownership bug**: hit `EACCES`/root-owned cache folder once, fixed with
  `sudo chown -R 501:20 "/Users/abhishek/.npm"`. If npm install fails with cache
  permission errors again, this is the fix.
- **npm global install permissions**: `npm install -g` fails with EACCES. Use
  `npx vercel` instead of a global install for all Vercel CLI operations.
- **A Python dict-unpacking bug** on the assistant's side corrupted the original
  `SKU_Tasks` seed data (literal strings `"name"`, `"team"`, `"status"` instead of
  real values — caused by `a, b, c = some_dict` iterating dict keys, not values).
  Fixed in `Setup_Launch_Control_Tabs_v2.gs`. If any tab ever shows literal
  placeholder-looking words instead of real content again, suspect the same class
  of bug in whatever script generated it.
- **Supabase renamed their API keys** (mid-2026): "publishable"/"secret" replaced
  "anon"/"service_role". The env var is still named `SUPABASE_SERVICE_ROLE_KEY` in
  this codebase for simplicity, but the actual value is the new secret-key format
  (`sb_secret_...`), not a JWT. Functionally equivalent (full access, bypasses RLS).

## Security notes

- A Monday.com API token and Slack webhook were found hardcoded in plain text in
  the pre-existing "Arrival Date by SKU" Apps Script (unrelated to this project,
  predates it). Flagged to Abhishek; he said he'd handle rotation/PropertiesService
  migration separately. Worth checking this got done if it comes up.
- The Google service account private key was accidentally exposed once via a
  terminal screenshot mid-project. Abhishek was walked through deleting that key in
  Google Cloud Console and generating a replacement. Local testing succeeded
  afterward, implying the rotation happened and the new key is what's in
  `.env.local` now — but this hasn't been independently double-confirmed.

## File structure

```
lib/sheets.ts          — Google Sheets read/write (getSkuTasks, updateTaskStatus, getPeople)
lib/supabase.ts         — Supabase server client (service-role, server-only)
app/api/tasks/route.ts  — GET pre-launch checklist, PATCH to toggle a task
app/api/postlaunch/route.ts — GET post-launch skeleton from Supabase
app/pre-launch/page.tsx — live checklist UI, readiness scoring
app/post-launch/page.tsx — live skeleton UI
app/layout.tsx           — sidebar nav
check-env.js              — safe .env.local diagnostic (never prints secret values)
Setup_Launch_Control_Tabs_v2.gs — paste into the Sheet's Apps Script editor to
  (re)populate People/Tasks_Template/SKU_Tasks tabs; safe to re-run
supabase_schema_and_seed.sql — run once in Supabase SQL Editor
```
