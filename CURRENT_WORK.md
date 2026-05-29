# Current Work - Colourbook

## QA E2E Loop — May 29, 2026 (DEPLOYED TO PROD ✅ — ALL GREEN)
Autonomous test→fix→deploy→retest loop against prod. **All non-skipped flows pass.**
7 bugs fixed across 6 commits + 2 DB migrations + prod env key sync + security
hardening. Full report: `tests/reports/QA-READINESS-2026-05-29.md`.

Final sweep confirmed green: route crawl (0 errors), PDF matrix (401/200/502/400/404),
CAS credit deduction, gpt-image-1 generation, signup→profile, family/book/order flows,
0 cb_ tables RLS-disabled. Prod data cleaned; QA user at 100 credits.

### Shipped this run (3 deploys)
- `458aadf` **fix: dashboard 500** — server component passed lucide icon *components*
  (functions) to client components; "Functions cannot be passed directly to Client
  Components" → every authed route 500'd. Now pass icon by name string + internal map.
- `7863026` **fix: image generation** — key has no `dall-e-3`; switched to `gpt-image-1`
  (drop style/response_format, quality high, decode b64_json). Real generation verified
  on prod (200, valid 1024px PNG, -1 credit via real UI).
- `f72c27d` **fix: /api/generate maxDuration=60** (gpt-image-1 ≈30s).

### Prod env fixed (was placeholders!)
- Synced real `OPENAI_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` to Vercel prod (had been
  `placeholder...` for 72d — generation + credits would have been broken on prod).

### Verified PASS (deterministic HTTP + DB)
- PDF download: 200/app-pdf, page-count==pages, credit -3 once, 502+no-charge on broken
  image, 402 insufficient, 404 cross-user, 401 unauth, 400 no-pages — ALL pass.
- Generation: real gpt-image-1 E2E, page→complete, image reachable, credit deducted.
- Dashboard + all user routes 200; admin routes 200 (as admin), 307 (non-admin).

### Rounds 3–4 — hardening + onboarding (deployed)
- `/api/generate` malformed JSON now 400 (was 500); FK covering indexes (migration 004).
- RLS cross-user isolation verified (no leaks); security advisor RPC hardened (003).
- Mobile no-overflow; every route + auth path + redirect-back verified.
- **Signup confirmation fix**: email confirmation is ON → signUp returns no session;
  page used to redirect to /dashboard → bounced new users to /login. Now shows
  "check your email" when no session.
- 🚩 **LAUNCH BLOCKER (needs your decision):** confirmation emails use Supabase
  default SMTP (rate-limited, 429). Either configure custom SMTP (Resend/SendGrid)
  or disable "Confirm email". Shared CC&SS auth config — not changed autonomously.

### Round 2 — deep coverage (3 MORE critical bugs, deployed)
- `5c6882c` **Generation never ran for real users** — generatePage fired an
  unauthenticated server→server fetch to /api/generate (401); page stuck pending,
  credit spent, no image. Now triggered from the browser; gallery auto-refreshes.
  Also made spendCredits atomic (CAS).
- `4fd3a78` (DB migration 002) **Signup created no profile** — cb_handle_new_user
  ran with search_path=auth (no public) → cb_profiles unresolved → swallowed →
  every signup stranded at /login. Fixed search_path; verified profile auto-creates.
- Verified E2E on prod (real browser): signup→profile, generate→image, checkout→
  order paid $39.98 + print queue + 15 credits, all routes 0 console errors.
- All test data + storage cleaned; QA user reset to 100 credits.

### Skipped (authorized)
- Stripe purchase/webhook (publishable key + webhook secret still placeholder in prod).
- Google OAuth (provider not configured).

### Follow-ups (non-blocking)
- Generation spends credit before image produced (no refund on failure) — product call.
- `cb_handle_new_user` trigger swallows profile-insert errors (signups could lack a row).
- `download_pdf` txn logs cost_cents=0 (cosmetic; credit debit correct).

---

## Overnight Fleet Run (May 28, 2026)
Shipped real PDF compilation + a QA test suite. PUSHED to `main` (commit 92e6664). Prod deploy NOT run (manual `vercel --prod` — paused per rails).

### Shipped + pushed (92e6664)
- **Real PDF compilation** — `/api/books/[bookId]/download` now builds an actual
  multi-page PDF via `pdf-lib` (one colouring image per US-Letter portrait page,
  centered, PNG/JPEG by magic bytes) instead of returning image-URL JSON.
  - Build happens BEFORE charging: build fail → 502 + no charge; insufficient
    credits → 402 + PDF discarded (never delivered unpaid). Returns
    `application/pdf` attachment. Node runtime, maxDuration 60.
  - `<a href>` callers (orders `pdf_url`, admin print-queue) now download a real PDF.
- **Test suite** — `tests/agent/download-and-credits-checklist.md` (QA-agent /
  real-data form per project no-unit-test rule): PDF correctness, no-charge-on-
  failure, 402/404/401 gating, Stripe credit-purchase, print queue, E2E.

### Stripe — PARTIAL (note for user)
- Only `STRIPE_SECRET_KEY` is present in `~/.env.keys`. **Publishable key +
  webhook secret are NOT** — required for the `/credits` purchase + webhook flow.
- No secrets committed. To finish: set `STRIPE_SECRET_KEY`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env.local`
  (gitignored) + Vercel env, then run checklist §C.

### PENDING USER (before prod deploy)
- Run the QA checklist against a preview (esp. PDF page-count + credit deduction).
- Provide remaining Stripe keys; sync Vercel env.
- Then `vercel --prod`.

---

## Prior Session Summary
Implemented full credits system + local printer pipeline, then ran a design pass with motion animations and Magic UI components. Filled real API keys (OpenAI, Supabase service role) from ~/.env.keys. Stripe keys still placeholder.

## What Changed
- d9094db: Credits system + local printer pipeline (15 files, +1191/-70)
  - DB migration: cb_credit_transactions, cb_credit_packs (4 seeded), cb_print_queue tables + RLS
  - Server actions: credits.ts (spend, add, grant, purchase, profitability), print-queue.ts
  - Credit costs: src/lib/credit-costs.ts (generate=1/$0.04, finalize=2, download=3, print=15/$12)
  - Pages/books/orders now use spendCredits() with cost tracking
  - Checkout page: credit-based (15 credits) instead of Stripe payment
  - Webhook handles credit_purchase Stripe sessions
  - New pages: /credits (store), /admin/print-queue, /admin/profitability
  - PDF download endpoint: /api/books/[bookId]/download (returns image URLs, no actual PDF compilation yet)
  - Sidebar: added Credits, Print Queue, Profitability nav links

- 52d3f24: Design pass — motion animations + Magic UI (11 files, +651/-105)
  - Installed motion (framer-motion) + Magic UI components
  - NumberTicker on dashboard stat cards
  - BorderBeam on featured "Generate" action card
  - SparklesText on landing hero text
  - motion.div hover/tap animations on dashboard cards
  - CreditsBadge now links to /credits with hover animation
  - Landing hero floating decorations use motion (smoother than CSS)

## Build Status
PASSING — clean build on 52d3f24, Next.js 16.1.7 Turbopack

## Known Bugs & Issues
- PDF download endpoint (src/app/api/books/[bookId]/download/route.ts) returns image URLs JSON, not an actual compiled PDF — needs pdf-lib or client-side PDF generation
- No email notifications when orders ship (tracking number emails)
- Credit purchase flow untested with real Stripe keys (still placeholder)

## Incomplete Work
- Stripe keys still placeholder in .env.local (sk_test_placeholder, whsec_placeholder)
- Need Stripe keys set in Vercel env vars for production credit purchases
- Google OAuth not configured in Supabase dashboard
- No refund flow for credits
- Profitability dashboard uses fallback JS aggregation (RPC function not available)

## Tests
- No automated tests written
- Manual visual verification via Playwright CLI screenshots (landing, login, dashboard)
- Untested: credits purchase flow, print queue workflow, PDF download, profitability data

## Next Steps (priority order)
1. Get Stripe keys from dashboard → fill .env.local + ~/.env.keys + Vercel env vars
2. Test credit purchase flow end-to-end with real Stripe
3. Implement actual PDF compilation (pdf-lib) in download endpoint
4. Test AI page generation with real OpenAI key (now filled)
5. Add shipping notification emails when admin marks order as shipped
6. Mobile responsive testing
7. Configure Google OAuth in Supabase dashboard

## Gotchas for Next Session
- .env.local has real OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY now (filled from ~/.env.keys)
- NEXT_PUBLIC_APP_URL set to https://colourbook-wine.vercel.app
- Vercel env vars likely still have old/placeholder values — need to sync
- Credits system uses admin client (supabaseAdmin) for atomic operations — RLS policies allow service_role only for writes
- The `motion` package (not `framer-motion`) is installed — Magic UI components depend on it
- cb_credit_packs seeded with 4 packs: Starter(10/$4.99), Popular(25/$9.99), Pro(50/$17.99), Family(100/$29.99)
- Checkout no longer uses Stripe — orders go straight to 'paid' status via credits, added to print queue

## Files Touched This Session
### Created
- src/lib/credit-costs.ts
- src/lib/actions/credits.ts
- src/lib/actions/print-queue.ts
- src/app/(protected)/credits/page.tsx
- src/app/(protected)/admin/print-queue/page.tsx
- src/app/(protected)/admin/profitability/page.tsx
- src/app/api/books/[bookId]/download/route.ts
- src/components/shared/animated-stat-card.tsx
- src/components/shared/animated-action-card.tsx
- src/components/landing/hero-animated.tsx
- src/components/ui/number-ticker.tsx
- src/components/ui/border-beam.tsx
- src/components/ui/sparkles-text.tsx

### Modified
- src/types/index.ts (CreditTransaction, CreditPack, PrintQueueItem types)
- src/lib/actions/pages.ts (spendCredits for generation)
- src/lib/actions/books.ts (spendCredits for finalize)
- src/lib/actions/orders.ts (credit-based ordering + print queue)
- src/app/api/stripe/webhook/route.ts (credit purchase handling)
- src/components/layout/sidebar.tsx (Credits, Print Queue, Profitability links)
- src/app/(protected)/admin/page.tsx (Print Queue stat, Profitability link)
- src/app/(protected)/checkout/[bookId]/page.tsx (credit-based checkout)
- src/app/(protected)/dashboard/page.tsx (animated cards)
- src/app/page.tsx (animated hero)
- src/components/shared/credits-badge.tsx (motion + link to /credits)
- .env.local (real OpenAI + Supabase keys filled)
