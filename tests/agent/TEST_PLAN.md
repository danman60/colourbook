# Colourbook — Test Plan (test-fix-loop config)

## Target
- **URL (prod):** https://colourbook-wine.vercel.app
- **Login URL:** https://colourbook-wine.vercel.app/login
- **Platform:** web (Next.js 16, Vercel)
- **Repo:** /home/danman60/projects/colourbook
- **Vercel project:** `colourbook` (org team_Jc7O5Ch5GTJGGWyBIhj9FCZ6)

## Deploy (FULL AUTO — authorized for this run)
- After fixing app bugs: commit + push `main`, then deploy:
  ```bash
  cd /home/danman60/projects/colourbook
  TOKEN=$(grep '^VERCEL_TOKEN=' ~/.env.keys | cut -d= -f2)
  npx vercel --prod --yes --token="$TOKEN" --scope team_Jc7O5Ch5GTJGGWyBIhj9FCZ6
  ```
- Build wait: ~240s (Next 16 Turbopack). See `.test-loop-config`.

## Credentials (email/password auth; OAuth NOT configured)
- **Email:** qa-colourbook@example.com
- **Password:** ColourbookQA2026!
- Create this account ONCE as a CONFIRMED user via Supabase service-role admin
  (signup may gate on email confirmation). One-off (run from repo, reads .env.local):
  ```js
  // scripts/qa-create-test-user.mjs
  import { createClient } from '@supabase/supabase-js';
  import { readFileSync } from 'node:fs';
  const env = Object.fromEntries(readFileSync('.env.local','utf8')
    .split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await sb.auth.admin.createUser({
    email:'qa-colourbook@example.com', password:'ColourbookQA2026!', email_confirm:true });
  console.log(error ? 'ERR '+error.message : 'OK '+data.user.id);
  ```
  If the user already exists, that's fine — proceed to login.

## Supabase
- Project: **CC&SS** (`supabase-CCandSS` MCP). Tables prefixed `cb_`.
- Verify DB state via MCP `execute_sql` (e.g. credit balance, cb_credit_transactions,
  cb_books, cb_pages, cb_print_queue). Service-role writes only.

## Checklist
- Primary: `tests/agent/download-and-credits-checklist.md`
- The QA agent should also exercise: landing, signup/login, dashboard, page
  generation, book create/finalize, credits store (UI only), gallery, orders,
  print queue (admin), profitability (admin), PDF download.

## SCOPE — what to test vs skip (authorized)
- **INCLUDE** OpenAI page generation (costs real $ per run — authorized).
- **INCLUDE** PDF download (real pdf-lib compilation), credit deduction, gating
  (402 insufficient credits, 404 ownership, 401 unauth).
- **SKIP** Stripe credit *purchase* + webhook: only `STRIPE_SECRET_KEY` is set;
  publishable key + webhook secret are MISSING. Test the `/credits` page UI only
  (packs render, buttons present) — do NOT attempt a real Stripe checkout.
- **SKIP** Google OAuth login (provider not configured in Supabase).

## Definition of done ("100%")
- Every non-skipped flow passes E2E in a real browser via the QA agent.
- PDF download returns a real multi-page application/pdf, page count == book pages,
  credits deducted exactly once, no charge on build failure.
- No console/page errors on any tested route.
- Skipped paths (Stripe purchase, OAuth) documented in the final QA report, not
  counted as failures.

## Circuit breakers
- Max 5 fix-loops. Stop and write a QA Readiness Report if: same failure persists
  2 loops, a deploy fails twice, or OpenAI/credit spend looks runaway.
- Never run destructive SQL. Never touch other Vercel projects.
