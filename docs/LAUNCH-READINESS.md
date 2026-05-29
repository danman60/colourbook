# Colourbook — Launch Readiness Checklist

Action-oriented summary from the 2026-05-29 autonomous QA pass. Full evidence:
`tests/reports/QA-READINESS-2026-05-29.md`. Everything in **§Fixed** is already
deployed to prod. Everything below it needs a human decision/action.

---

## ✅ Fixed + deployed this pass (11)
No action needed — listed so you know what changed.
1. Dashboard 500 (icon component passed across server/client boundary).
2. Image generation: `dall-e-3` (gone) → `gpt-image-1`.
3. `/api/generate` `maxDuration=60` (gen ~30s).
4. **Generation never ran for real users** — unauthenticated internal fetch → 401;
   now triggered from the browser; gallery auto-refreshes.
5. **Signup created no profile** — trigger `search_path` (DB migration 002);
   onboarding was fully broken.
6. `spendCredits` race → compare-and-swap (validated under concurrency).
7. Security: revoked public RPC EXECUTE on the signup trigger (migration 003).
8. `/api/generate` malformed JSON → 400 (was 500).
9. Perf: covering indexes for 6 unindexed FKs (migration 004).
10. Signup w/ email confirmation: stop bouncing users to /login; show "check email".
11. `createOrder`: refund credits on failed insert + flag unqueued paid orders.

Also synced real `OPENAI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` to prod (were placeholders).

---

## 🚩 BLOCKER — must resolve before real users sign up
**Confirmation emails won't deliver at volume.** Email confirmation is ON, but the
project uses Supabase's default built-in SMTP (rate-limited; signups hit
`429 over_email_send_rate_limit`). Real users may never get the activation email.
- **Option A (recommended for launch):** configure a custom SMTP provider in Supabase
  Auth → Settings → SMTP (Resend / SendGrid / Postmark). Needs provider API key + a
  verified sending domain.
- **Option B (frictionless):** disable "Confirm email" in Supabase Auth settings —
  matches the landing page's "start instantly / no credit card" promise.
- ⚠️ This is the **shared CC&SS** auth config (affects other apps on the project) —
  decide deliberately; not changed autonomously.

---

## HIGH — should have before launch
- **No password-reset flow exists.** No `resetPasswordForEmail` / forgot-password UI
  anywhere. Users who forget their password are locked out. Needs a small build
  (forgot-password page + reset page via `/auth/callback`) and depends on the same
  SMTP as the blocker above.

## MEDIUM — product/perf decisions
- **"Finalize book" is unimplemented.** `updateBook(status:'complete')` + the
  `finalize_book` 2-credit charge are never called from any UI (book goes
  draft → ordered; download & order both work without it). Decide: wire a Finalize
  step, or remove the cost/label to avoid confusion.
- **RLS perf at scale** (advisor): 25 cb_ policies call `auth.uid()` per-row
  (`auth_rls_initplan`) and 15 have `multiple_permissive_policies`. Wrapping in
  `(select auth.uid())` + consolidating is the standard fix. Negligible at current
  scale; do it as a deliberate, reviewed migration (40 live access-control policies —
  not safe to rewrite autonomously).

## LOW / cosmetic
- `download_pdf` transactions log `cost_cents=0` (credit debit is correct).
- `getCustomerProfitability` calls a non-existent `exec_sql` RPC and falls back to JS
  aggregation (works). Add the RPC or drop the call.
- Checkout Print-Partner dropdown showed the partner UUID under synthetic clicks
  (likely a Radix quirk on programmatic selection) — confirm with a real click.
- `regenerate_page` credit action is defined but unused (no regenerate feature).
- 4 unused indexes flagged by the advisor (INFO only).

---

## Skipped this pass (authorized)
- Stripe credit *purchase* + webhook — only `STRIPE_SECRET_KEY` set in prod;
  publishable key + webhook secret are placeholders. `/credits` UI renders and the
  Buy action degrades gracefully. To enable: set the two missing keys (prod + local)
  and run checklist §C.
- Google OAuth — provider not configured in Supabase.
